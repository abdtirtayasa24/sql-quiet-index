import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import type * as Fixture from '../fixtures/storage-browser';
test.beforeEach(async ({ page }) => {
  await page.route('**/__storage-fixture.js', (route) =>
    route.fulfill({
      path: resolve('generated/storage-fixture/fixture.js'),
      contentType: 'text/javascript',
    }),
  );
  await page.goto('/');
});
test('copy ID collision and combined capacity never replace any existing campaign @portable', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const u = '/__storage-fixture.js';
    const f = (await import(u)) as typeof Fixture;
    const r = await f.openProgress();
    const id = 'c-00000000-0000-4000-8000-000000000000';
    const file = await f.validateCaseFile(
      await f.exportCaseFile(f.caseCollections(id)),
    );
    await r.importCaseFile(file, 'merge', true);
    const before = await r.snapshot();
    const original = crypto.randomUUID.bind(crypto);
    crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
    let collision = '';
    try {
      await r.importCaseFile(file, 'copy', true);
    } catch (e) {
      collision = e instanceof Error ? e.message : 'unexpected';
    }
    crypto.randomUUID = original;
    const after = await r.snapshot();
    for (let i = 0; i < 7; i++) await r.importCaseFile(file, 'copy', true);
    const full = await r.snapshot();
    let capacity = '';
    try {
      await r.importCaseFile(file, 'copy', true);
    } catch (e) {
      capacity = e instanceof Error ? e.message : 'unexpected';
    }
    const retained = await r.snapshot();
    r.close();
    return { before, after, collision, capacity, full, retained };
  });
  expect(result.collision).toBe('identity');
  expect(result.after).toEqual(result.before);
  expect(result.full.campaigns).toHaveLength(8);
  expect(result.capacity).toBe('schema');
  expect(result.retained).toEqual(result.full);
});
test('quota abort preserves old records and pauses subsequent writes @portable', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const u = '/__storage-fixture.js';
    const f = (await import(u)) as typeof Fixture;
    const r = await f.openProgress();
    const file = await f.validateCaseFile(
      await f.exportCaseFile(f.caseCollections()),
    );
    await r.importCaseFile(file, 'merge', true);
    const before = await r.snapshot();
    const original = Reflect.get<IDBObjectStore, 'put'>(
      IDBObjectStore.prototype,
      'put',
    );
    IDBObjectStore.prototype.put = function (v: unknown, k?: IDBValidKey) {
      if (this.name === 'evidence')
        throw new DOMException('injected', 'QuotaExceededError');
      return original.call(this, v, k);
    };
    const errors: string[] = [];
    try {
      await r.importCaseFile(file, 'copy', true);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'unexpected');
    }
    IDBObjectStore.prototype.put = original;
    try {
      await r.saveDraft('c-test', '001', 'must not save', {
        updatedAt: new Date().toISOString(),
        tabId: 'tab',
        revision: 1,
      });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'unexpected');
    }
    const after = await r.snapshot();
    r.close();
    return { before, after, errors };
  });
  expect(result.errors).toEqual(['quota', 'quota']);
  expect(result.after).toEqual(result.before);
});
test('import never changes local operational backups or metadata @portable', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const u = '/__storage-fixture.js';
    const f = (await import(u)) as typeof Fixture;
    const r = await f.openProgress();
    const file = await f.validateCaseFile(
      await f.exportCaseFile(f.caseCollections()),
    );
    await r.importCaseFile(file, 'merge', true);
    const request = indexedDB.open('tqi-progress-v1');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(['meta', 'backups'], 'readwrite');
    tx.objectStore('meta').add({ key: 'private-operational', value: 'retain' });
    tx.objectStore('backups').add({
      campaignId: 'c-test',
      backupId: 'saved-before-import',
      saveVersion: 1,
      data: { private: 'retain' },
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(tx.error ?? new Error('Native transaction failed'));
    });
    db.close();
    const before = await r.snapshot();
    await r.importCaseFile(file, 'copy', true);
    const after = await r.snapshot();
    r.close();
    return { before, after };
  });
  expect(result.after.meta).toEqual(result.before.meta);
  expect(result.after.backups).toEqual(result.before.backups);
});
test('confirmed native import/export retains every collection and copy remaps all campaign references @portable', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const f = (await import(url)) as typeof Fixture;
    const repo = await f.openProgress();
    const source = f.caseCollections();
    const file = await f.validateCaseFile(await f.exportCaseFile(source));
    await repo.importCaseFile(file, 'merge', true);
    const restored = await f.validateCaseFile(
      await f.exportCaseFile(await repo.snapshot()),
    );
    const copy = await repo.importCaseFile(file, 'copy', true);
    const all = await repo.snapshot();
    repo.close();
    return { source, restored, copy, all };
  });
  for (const name of Object.keys(
    result.source,
  ) as (keyof typeof result.source)[])
    expect(result.restored[name]).toEqual(result.source[name]);
  expect(result.all.campaigns).toHaveLength(2);
  expect(result.copy.campaignIds[0]).not.toBe('c-test');
  expect(result.all.notes).toContainEqual(
    expect.objectContaining({
      campaignId: result.copy.campaignIds[0],
      evidenceRefs: [
        { campaignId: result.copy.campaignIds[0], evidenceId: 'e-1' },
      ],
    }),
  );
});
test('preview/nonconfirmation, tampered hash and conflicting seed cannot partially replace canonical data @portable', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const f = (await import(url)) as typeof Fixture;
    const repo = await f.openProgress();
    const file = await f.validateCaseFile(
      await f.exportCaseFile(f.caseCollections()),
    );
    await repo.importCaseFile(file, 'merge', true);
    const before = await repo.snapshot();
    const errors: string[] = [];
    for (const [input, confirmed] of [
      [file, false],
      [{ ...file, appVersion: 'tampered' }, true],
    ] as const) {
      try {
        await repo.importCaseFile(input, 'merge', confirmed);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'unexpected');
      }
    }
    const conflict = f.caseCollections();
    conflict.campaigns[0]!.seed = 'ffffffff';
    try {
      await repo.importCaseFile(
        await f.validateCaseFile(await f.exportCaseFile(conflict)),
        'merge',
        true,
      );
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'unexpected');
    }
    const after = await repo.snapshot();
    repo.close();
    return { before, after, errors };
  });
  expect(result.errors).toEqual(['confirmation', 'integrity', 'identity']);
  expect(result.after).toEqual(result.before);
});
test('native late constraint abort rolls back all import stores including earlier request successes @portable', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const f = (await import(url)) as typeof Fixture;
    const repo = await f.openProgress();
    const original = Reflect.get<IDBObjectStore, 'put'>(
      IDBObjectStore.prototype,
      'put',
    );
    let successes = 0;
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      const request = original.call(this, value, key);
      request.addEventListener('success', () => successes++);
      if (this.name === 'verdicts') this.add(value, key);
      return request;
    };
    let error = '';
    try {
      await repo.importCaseFile(
        await f.validateCaseFile(await f.exportCaseFile(f.caseCollections())),
        'merge',
        true,
      );
    } catch (e) {
      error = e instanceof Error ? e.message : 'unexpected';
    }
    IDBObjectStore.prototype.put = original;
    const data = await repo.snapshot();
    repo.close();
    return { successes, error, data };
  });
  expect(result.successes).toBeGreaterThan(0);
  expect(result.error).toBe('aborted');
  for (const rows of Object.values(result.data)) expect(rows).toEqual([]);
});
test('confirmation merges the latest native draft, not an earlier preview snapshot @portable', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const f = (await import(url)) as typeof Fixture;
    const repo = await f.openProgress();
    const file = await f.validateCaseFile(
      await f.exportCaseFile(f.caseCollections()),
    );
    await repo.importCaseFile(file, 'merge', true);
    const other = await f.openProgress();
    await other.saveDraft('c-test', '001', 'new text in another tab', {
      updatedAt: '2026-12-01T00:00:00.000Z',
      tabId: 'later-tab',
      revision: 1,
    });
    const merged = await repo.importCaseFile(file, 'merge', true);
    const data = await repo.snapshot();
    repo.close();
    other.close();
    return { merged, data };
  });
  expect(result.data.missionStates).toContainEqual(
    expect.objectContaining({
      lastDraft: 'new text in another tab',
      status: 'solved',
    }),
  );
  expect(result.merged.conflicts).toContain('missionStates:c-test:001');
});
