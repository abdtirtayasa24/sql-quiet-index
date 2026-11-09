import { expect, it } from 'vitest';
import { newCampaign, schema } from '../../src/storage/schema';

it('defines every v1 key and campaign-scoped index without a SQL database', () => {
  expect(Object.keys(schema)).toEqual([
    'campaigns',
    'missionStates',
    'attempts',
    'evidence',
    'notes',
    'conceptEvents',
    'verdicts',
    'backups',
    'meta',
  ]);
  expect(schema.missionStates.keyPath).toEqual(['campaignId', 'missionId']);
  expect(schema.evidence.indexes).toEqual({
    byMission: ['campaignId', 'missionId'],
    byCase: ['campaignId', 'actId'],
    byNode: ['campaignId', 'nodeId'],
  });
  expect(schema.attempts.indexes).toEqual({
    byMission: ['campaignId', 'missionId'],
    byTimestamp: ['campaignId', 'timestamp'],
  });
  expect(schema.notes.indexes).toEqual({
    byCase: ['campaignId', 'actId'],
    byUpdatedAt: ['campaignId', 'updatedAt'],
  });
  expect(schema.conceptEvents.indexes).toEqual({
    byConcept: ['campaignId', 'conceptId'],
    byItem: ['campaignId', 'itemId'],
  });
});
it('creates a cryptographic immediately-persistable identity without fake progress', () => {
  const a = newCampaign('en');
  const b = newCampaign('en');
  expect(a.seed).toMatch(/^[0-9a-f]{16}$/);
  expect(b.seed).not.toBe(a.seed);
  expect(a.campaignId).not.toBe(b.campaignId);
  expect(a.completedMissionIds).toEqual([]);
  expect(a.saveVersion).toBe(1);
  expect(a.createdAt).toBe(a.updatedAt);
});
