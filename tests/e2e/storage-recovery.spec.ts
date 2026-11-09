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
test('migration backup and all records commit together, or all roll back @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    let repo = await openProgress();
    const campaign = await repo.create(newCampaign('en'));
    await repo.saveDraft(campaign.campaignId, '001', 'private draft', {
      updatedAt: '2026-11-01T00:00:00.000Z',
      tabId: 'a',
      revision: 1,
    });
    const before = await repo.snapshot();
    const original = Reflect.get<IDBObjectStore, 'put'>(
      IDBObjectStore.prototype,
      'put',
    );
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (this.name === 'missionStates')
        throw new DOMException('injected', 'AbortError');
      return original.call(this, value, key);
    };
    let code = '';
    try {
      await repo.migrateCampaign(campaign.campaignId, 2, { 1: (copy) => copy });
    } catch (error) {
      code = error instanceof Error ? error.message : '';
    }
    IDBObjectStore.prototype.put = original;
    const rolledBack = await repo.snapshot();
    repo.close();
    repo = await openProgress();
    await repo.migrateCampaign(campaign.campaignId, 2, { 1: (copy) => copy });
    const after = await repo.snapshot();
    repo.close();
    return { code, before, rolledBack, after };
  });
  expect(result.code).toBe('aborted');
  expect(result.rolledBack).toEqual(result.before);
  expect(result.after.campaigns).toMatchObject([{ saveVersion: 2 }]);
  expect(result.after.missionStates).toMatchObject([
    { lastDraft: 'private draft', saveVersion: 2 },
  ]);
  expect(result.after.backups).toHaveLength(1);
  expect(result.after.backups).toMatchObject([
    {
      data: {
        campaigns: result.before.campaigns,
        missionStates: result.before.missionStates,
      },
    },
  ]);
});
test('quota failure aborts partial progress, pauses further writes and retains readable records @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    const campaign = await repo.create(newCampaign('en'));
    const before = await repo.snapshot();
    const original = Reflect.get<IDBObjectStore, 'add'>(
      IDBObjectStore.prototype,
      'add',
    );
    IDBObjectStore.prototype.add = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (this.name === 'evidence')
        throw new DOMException('injected', 'QuotaExceededError');
      return original.call(this, value, key);
    };
    let code = '';
    try {
      await repo.mergeProgress(
        campaign.campaignId,
        ['001'],
        [{ campaignId: campaign.campaignId, saveVersion: 1, evidenceId: 'e' }],
        [],
      );
    } catch (e) {
      code = e instanceof Error ? e.message : '';
    }
    IDBObjectStore.prototype.add = original;
    let paused = '';
    try {
      await repo.mergeProgress(campaign.campaignId, ['002'], [], []);
    } catch (e) {
      paused = e instanceof Error ? e.message : '';
    }
    const after = await repo.snapshot();
    repo.close();
    return { before, after, code, paused };
  });
  expect(result.code).toBe('quota');
  expect(result.paused).toBe('quota');
  expect(result.after).toEqual(result.before);
});
test('a failed write also aborts already-queued writes before they can commit progress @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    const campaign = await repo.create(newCampaign('en'));
    const before = await repo.snapshot();
    const original = Reflect.get<IDBObjectStore, 'add'>(
      IDBObjectStore.prototype,
      'add',
    );
    IDBObjectStore.prototype.add = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (this.name === 'evidence')
        throw new DOMException('injected', 'QuotaExceededError');
      return original.call(this, value, key);
    };
    const results = await Promise.allSettled([
      repo.mergeProgress(
        campaign.campaignId,
        ['001'],
        [{ campaignId: campaign.campaignId, saveVersion: 1, evidenceId: 'e' }],
        [],
      ),
      repo.mergeProgress(campaign.campaignId, ['002'], [], []),
    ]);
    IDBObjectStore.prototype.add = original;
    const after = await repo.snapshot();
    repo.close();
    return { before, after, states: results.map((r) => r.status) };
  });
  expect(result.states).toEqual(['rejected', 'rejected']);
  expect(result.after).toEqual(result.before);
});
test('future save and database versions remain readable and are never downgraded @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    let repo = await openProgress();
    const campaign = await repo.create(newCampaign('en'));
    await repo.migrateCampaign(campaign.campaignId, 2, { 1: (copy) => copy });
    const before = await repo.snapshot();
    let code = '';
    try {
      await repo.saveDraft(campaign.campaignId, '001', 'must not write', {
        updatedAt: '2026-11-01T00:00:00.000Z',
        tabId: 'a',
        revision: 1,
      });
    } catch (e) {
      code = e instanceof Error ? e.message : '';
    }
    repo.close();
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open('tqi-progress-v1', 9);
      r.onsuccess = () => {
        r.result.close();
        resolve();
      };
      r.onerror = () => reject(new Error('upgrade failed'));
    });
    repo = await openProgress();
    let future = '';
    try {
      await repo.create(newCampaign('en'));
    } catch (e) {
      future = e instanceof Error ? e.message : '';
    }
    const after = await repo.snapshot();
    repo.close();
    return { before, after, code, future };
  });
  expect(result.code).toBe('future');
  expect(result.future).toBe('future');
  expect(result.after).toEqual(result.before);
});
