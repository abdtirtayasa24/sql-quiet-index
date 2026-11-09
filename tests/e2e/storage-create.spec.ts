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
test('native v1 schema, seed and identity survive a fresh connection @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign, schema } = (await import(
      url
    )) as typeof Fixture;
    const repo = await openProgress();
    const campaign = newCampaign('en');
    await repo.create(campaign);
    repo.close();
    const reopened = await openProgress();
    const raw = await reopened.snapshot();
    const request = indexedDB.open('tqi-progress-v1');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const keys = Object.keys(schema).map((name) => {
      const s = db.transaction(name).objectStore(name);
      return [
        name,
        s.keyPath,
        [...s.indexNames].map((index) => [index, s.index(index).keyPath]),
      ];
    });
    db.close();
    reopened.close();
    return { campaign, raw, keys };
  });
  expect(result.raw.campaigns).toEqual([result.campaign]);
  expect(result.keys).toHaveLength(9);
  expect(result.keys.find(([name]) => name === 'evidence')?.[2]).toEqual([
    ['byCase', ['campaignId', 'actId']],
    ['byMission', ['campaignId', 'missionId']],
    ['byNode', ['campaignId', 'nodeId']],
  ]);
});
test('creation abort never leaves an identity or metadata success marker @storage', async ({
  page,
}) => {
  const data = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    const original = Reflect.get<IDBObjectStore, 'add'>(
      IDBObjectStore.prototype,
      'add',
    );
    IDBObjectStore.prototype.add = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (this.name === 'meta')
        throw new DOMException('injected', 'AbortError');
      return original.call(this, value, key);
    };
    let code = '';
    try {
      await repo.create(newCampaign('en'));
    } catch (error) {
      code = error instanceof Error ? error.message : 'unexpected';
    }
    IDBObjectStore.prototype.add = original;
    const raw = await repo.snapshot();
    repo.close();
    return { code, raw };
  });
  expect(data.code).toBe('aborted');
  expect(data.raw.campaigns).toEqual([]);
  expect(data.raw.meta).toEqual([]);
});
test('canonical writes request the native strict durability hint @storage', async ({
  page,
}) => {
  const hints = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const seen: string[] = [];
    const original = Reflect.get<IDBDatabase, 'transaction'>(
      IDBDatabase.prototype,
      'transaction',
    );
    IDBDatabase.prototype.transaction = function (
      stores: string | Iterable<string>,
      mode?: IDBTransactionMode,
      options?: IDBTransactionOptions,
    ) {
      const tx = original.call(this, stores, mode, options);
      if (mode === 'readwrite') seen.push(tx.durability);
      return tx;
    };
    const repo = await openProgress();
    await repo.create(newCampaign('en'));
    repo.close();
    IDBDatabase.prototype.transaction = original;
    return seen;
  });
  expect(hints).toEqual(['strict']);
});
test('request success cannot announce a save when a later request aborts the transaction @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    const campaign = newCampaign('en');
    const request = indexedDB.open('tqi-progress-v1');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('meta', 'readwrite');
      tx.objectStore('meta').add({ key: `created:${campaign.campaignId}` });
      tx.oncomplete = () => resolve();
    });
    db.close();
    let code = '';
    try {
      await repo.create(campaign);
    } catch (e) {
      code = e instanceof Error ? e.message : '';
    }
    const data = await repo.snapshot();
    repo.close();
    return { code, data };
  });
  expect(result.code).toBe('aborted');
  expect(result.data.campaigns).toEqual([]);
  expect(result.data.meta).toHaveLength(1);
});
test('unavailable storage fails explicitly; a version upgrade closes the old connection @storage', async ({
  page,
}) => {
  expect(
    await page.evaluate(async () => {
      const url = '/__storage-fixture.js';
      const { openProgress } = (await import(url)) as typeof Fixture;
      try {
        await openProgress(undefined, null);
      } catch (error) {
        return error instanceof Error ? error.message : '';
      }
      return 'unexpected';
    }),
  ).toBe('unavailable');
  const outcome = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const notices: string[] = [];
    const repo = await openProgress((code) => notices.push(code), indexedDB);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('tqi-progress-v1', 2);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(new Error('Upgrade failed'));
    });
    let code = '';
    try {
      await repo.create(newCampaign('en'));
    } catch (e) {
      code = e instanceof Error ? e.message : '';
    }
    return { notices, code };
  });
  expect(outcome).toEqual({
    notices: ['versionchange'],
    code: 'versionchange',
  });
});
test('a malformed existing v1 schema is preserved and rejected, never treated as a new empty case @storage', async ({
  page,
}) => {
  expect(
    await page.evaluate(async () => {
      const request = indexedDB.open('tqi-progress-v1', 1);
      await new Promise<void>((resolve) => {
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
      });
      const url = '/__storage-fixture.js';
      const { openProgress } = (await import(url)) as typeof Fixture;
      try {
        const repo = await openProgress();
        repo.close();
        return 'unexpected';
      } catch (error) {
        return error instanceof Error ? error.message : '';
      }
    }),
  ).toBe('corrupt');
});
test('blocked open rejects promptly and closes its eventual connection @storage', async ({
  page,
}) => {
  expect(
    await page.evaluate(async () => {
      const url = '/__storage-fixture.js';
      const { openProgress } = (await import(url)) as typeof Fixture;
      const request = indexedDB.open('tqi-progress-v1');
      const blocker = await new Promise<IDBDatabase>((resolve) => {
        request.onsuccess = () => resolve(request.result);
      });
      let code = '';
      try {
        await openProgress(undefined, indexedDB, 2);
      } catch (e) {
        code = e instanceof Error ? e.message : '';
      }
      blocker.close();
      return code;
    }),
  ).toBe('blocked');
});
