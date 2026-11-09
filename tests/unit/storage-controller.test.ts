import { expect, it } from 'vitest';
import { StorageController } from '../../src/app/storage-controller';
import type { ProgressPort } from '../../src/app/storage-controller';
import { LocalStore } from '../../src/storage/local';
import { newCampaign } from '../../src/storage/schema';
import type { Collections } from '../../src/types/save';
function fixture(raw: Collections) {
  const memory = new Map<string, string>();
  const local = new LocalStore(() => ({
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, text) => {
      memory.set(key, text);
    },
  }));
  const repo: ProgressPort = {
    futureSchema: false,
    close: () => {},
    snapshot: () => Promise.resolve(structuredClone(raw)),
    create: () => Promise.reject(new Error('must not auto-create')),
    saveDraft: () => Promise.reject(new Error('not writable')),
  };
  return { local, memory, repo };
}
it('a surviving pointer with missing IDB triggers recovery, never a replacement campaign', async () => {
  const { local, memory, repo } = fixture({ campaigns: [] });
  local.savePointer({
    campaignId: 'lost',
    updatedAt: new Date().toISOString(),
  });
  const app = new StorageController(
    () => {},
    local,
    () => Promise.resolve(repo),
  );
  await app.start();
  expect(app.phase).toBe('recovery');
  expect(app.issue).toBe('missing');
  expect(memory.has('tqi.v1.savePointer')).toBe(true);
  app.dispose();
});
it('a completely empty origin remains an explicit empty state, not detected eviction or auto-created progress', async () => {
  const { local, repo } = fixture({ campaigns: [] });
  const app = new StorageController(
    () => {},
    local,
    () => Promise.resolve(repo),
  );
  await app.start();
  expect(app.phase).toBe('empty');
  expect(app.campaign).toBeUndefined();
  app.dispose();
});
it('future records stay read-only and recovery download preserves unknown fields', async () => {
  const raw = {
    campaigns: [
      {
        ...newCampaign('en'),
        saveVersion: 99,
        futurePrivateField: 'do not discard',
      },
    ],
  };
  const { local, repo } = fixture(raw);
  const app = new StorageController(
    () => {},
    local,
    () => Promise.resolve(repo),
  );
  await app.start();
  expect(app.issue).toBe('future');
  const recovery: unknown = JSON.parse(await app.recovery());
  expect(recovery).toMatchObject({ records: raw });
  app.dispose();
});
it('blocked settings do not replace a canonical campaign; existing IDB is found without a pointer', async () => {
  const campaign = newCampaign('en');
  const { repo } = fixture({ campaigns: [campaign] });
  const local = new LocalStore(() => {
    throw new DOMException('denied', 'SecurityError');
  });
  const app = new StorageController(
    () => {},
    local,
    () => Promise.resolve(repo),
  );
  await app.start();
  expect(app.phase).toBe('ready');
  expect(app.campaign?.campaignId).toBe(campaign.campaignId);
  app.setSettings({ locale: 'en', theme: 'dark', motion: 'reduce' });
  expect(app.settingsSaved).toBe(false);
  app.dispose();
});
