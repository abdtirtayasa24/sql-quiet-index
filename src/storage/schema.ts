import type { Campaign, Locale } from '../types/save';

export const DB_NAME = 'tqi-progress-v1';
export const DB_VERSION = 1;
interface StoreSchema {
  keyPath: string | string[];
  indexes: Record<string, string[]>;
}
export const schema = {
  campaigns: { keyPath: 'campaignId', indexes: {} },
  missionStates: { keyPath: ['campaignId', 'missionId'], indexes: {} },
  attempts: {
    keyPath: ['campaignId', 'attemptId'],
    indexes: {
      byMission: ['campaignId', 'missionId'],
      byTimestamp: ['campaignId', 'timestamp'],
    },
  },
  evidence: {
    keyPath: ['campaignId', 'evidenceId'],
    indexes: {
      byMission: ['campaignId', 'missionId'],
      byCase: ['campaignId', 'actId'],
      byNode: ['campaignId', 'nodeId'],
    },
  },
  notes: {
    keyPath: ['campaignId', 'noteId'],
    indexes: {
      byCase: ['campaignId', 'actId'],
      byUpdatedAt: ['campaignId', 'updatedAt'],
    },
  },
  conceptEvents: {
    keyPath: ['campaignId', 'eventId'],
    indexes: {
      byConcept: ['campaignId', 'conceptId'],
      byItem: ['campaignId', 'itemId'],
    },
  },
  verdicts: { keyPath: ['campaignId', 'actId'], indexes: {} },
  backups: { keyPath: ['campaignId', 'backupId'], indexes: {} },
  meta: { keyPath: 'key', indexes: {} },
} satisfies Record<string, StoreSchema>;
export type StoreName = keyof typeof schema;
export const campaignStores = Object.keys(schema).filter(
  (key): key is Exclude<StoreName, 'meta' | 'backups'> =>
    key !== 'meta' && key !== 'backups',
);

export function newCampaign(locale: Locale): Campaign {
  const seed = Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const now = new Date().toISOString();
  return {
    campaignId: `c-${crypto.randomUUID()}`,
    saveVersion: 1,
    contentVersion: 'cp1a-storage-1',
    engineVersion: '0.5.13',
    seed,
    createdAt: now,
    updatedAt: now,
    activeMissionId: '001',
    locale,
    completedMissionIds: [],
    endingId: null,
  };
}
