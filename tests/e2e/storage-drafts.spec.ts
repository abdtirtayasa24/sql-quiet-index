import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import type * as Fixture from '../fixtures/storage-browser';

test.beforeEach(async ({ context, page }) => {
  await context.route('**/__storage-fixture.js', (route) =>
    route.fulfill({
      path: resolve('generated/storage-fixture/fixture.js'),
      contentType: 'text/javascript',
    }),
  );
  await page.goto('/');
});
test('two tabs merge event IDs and a delayed draft cannot overwrite solved progress @storage', async ({
  page,
  context,
}) => {
  const id = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    const campaign = await repo.create({
      ...newCampaign('en'),
      activeMissionId: '002',
    });
    repo.close();
    return campaign.campaignId;
  });
  const other = await context.newPage();
  await other.goto('/');
  await other.evaluate(async (campaignId) => {
    const url = '/__storage-fixture.js';
    const { openProgress } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    await repo.mergeProgress(
      campaignId,
      ['001'],
      [
        {
          campaignId,
          saveVersion: 1,
          evidenceId: 'e1',
          missionId: '001',
          actId: 'act01',
          nodeId: 'a1.one',
        },
      ],
      [
        {
          campaignId,
          saveVersion: 1,
          eventId: 'solved-001',
          conceptId: 'projection',
          itemId: '001',
        },
      ],
    );
    repo.close();
  }, id);
  const raw = await page.evaluate(async (campaignId) => {
    const url = '/__storage-fixture.js';
    const { openProgress } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    await repo.saveDraft(campaignId, '001', 'SELECT 42;', {
      updatedAt: '2026-11-01T00:00:00.000Z',
      tabId: 'old-tab',
      revision: 1,
    });
    await repo.mergeProgress(
      campaignId,
      ['002', '001'],
      [
        {
          campaignId,
          saveVersion: 1,
          evidenceId: 'e1',
          missionId: '001',
          nodeId: 'must-not-overwrite',
        },
      ],
      [
        {
          campaignId,
          saveVersion: 1,
          eventId: 'solved-001',
          itemId: 'must-not-overwrite',
        },
      ],
    );
    const raw = await repo.snapshot();
    repo.close();
    return raw;
  }, id);
  expect(raw.campaigns).toMatchObject([
    { completedMissionIds: ['001', '002'], activeMissionId: '002' },
  ]);
  expect(raw.evidence).toHaveLength(1);
  expect(raw.evidence).toMatchObject([{ nodeId: 'a1.one' }]);
  expect(raw.conceptEvents).toHaveLength(1);
  expect(raw.conceptEvents).toMatchObject([{ itemId: '001' }]);
  expect(raw.missionStates).toMatchObject([{ lastDraft: 'SELECT 42;' }]);
});
test('duplicate IDs inside a single batch are idempotent, not an aborted save @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    const c = await repo.create(newCampaign('en'));
    const evidence = {
      campaignId: c.campaignId,
      saveVersion: 1,
      evidenceId: 'same',
    };
    const event = { campaignId: c.campaignId, saveVersion: 1, eventId: 'same' };
    await repo.mergeProgress(
      c.campaignId,
      ['001', '001'],
      [evidence, evidence],
      [event, event],
    );
    const result = await repo.snapshot();
    repo.close();
    return result;
  });
  expect(result.evidence).toHaveLength(1);
  expect(result.conceptEvents).toHaveLength(1);
  expect(result.campaigns).toMatchObject([{ completedMissionIds: ['001'] }]);
});
test('same-time draft conflict converges on stable tab ID, not write arrival @storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const { openProgress, newCampaign } = (await import(url)) as typeof Fixture;
    const a = await openProgress();
    const b = await openProgress();
    const campaign = await a.create(newCampaign('en'));
    const stamp = {
      updatedAt: '2026-11-01T00:00:00.000Z',
      tabId: 'b',
      revision: 1,
    };
    await b.saveDraft(campaign.campaignId, '001', 'new', stamp);
    const conflict = await a.saveDraft(campaign.campaignId, '001', 'old', {
      ...stamp,
      tabId: 'a',
      revision: 99,
    });
    const repeated = await a.saveDraft(
      campaign.campaignId,
      '001',
      'same-tab-newer',
      { ...stamp, revision: 2 },
    );
    const raw = await a.snapshot();
    a.close();
    b.close();
    return { conflict, repeated, raw };
  });
  expect(result.conflict.applied).toBe(false);
  expect(result.repeated.applied).toBe(true);
  expect(result.raw.missionStates).toMatchObject([
    { lastDraft: 'same-tab-newer' },
  ]);
});
