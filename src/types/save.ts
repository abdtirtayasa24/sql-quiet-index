export type Locale = 'en' | 'id';
export interface Campaign {
  campaignId: string;
  saveVersion: number;
  contentVersion: string;
  engineVersion: string;
  seed: string;
  createdAt: string;
  updatedAt: string;
  activeMissionId: string;
  locale: Locale;
  completedMissionIds: string[];
  endingId: string | null;
}
export interface DraftStamp {
  updatedAt: string;
  tabId: string;
  revision: number;
}
export interface MissionState {
  campaignId: string;
  missionId: string;
  saveVersion: number;
  status: 'in_progress' | 'solved';
  seedVariant: number;
  lastDraft: string;
  draftStamp: DraftStamp;
  lastRunAt: string | null;
  hintMaxSeen: number;
  bestOutcome: string | null;
  acceptedQueryHash: string | null;
  firstSolvedAt: string | null;
}
export type SaveRow = Record<string, unknown> & {
  campaignId: string;
  saveVersion: number;
};
export type Collections = Record<string, unknown[]>;
export type StorageCode =
  | 'unavailable'
  | 'blocked'
  | 'versionchange'
  | 'quota'
  | 'aborted'
  | 'missing'
  | 'future'
  | 'corrupt';
export class StorageFailure extends Error {
  constructor(readonly code: StorageCode) {
    super(code);
    this.name = 'StorageFailure';
  }
}
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isCampaign(value: unknown): value is Campaign {
  return (
    isObject(value) &&
    typeof value.campaignId === 'string' &&
    value.saveVersion === 1 &&
    typeof value.seed === 'string' &&
    /^[0-9a-f]{8,16}$/.test(value.seed) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.contentVersion === 'string' &&
    typeof value.engineVersion === 'string' &&
    typeof value.activeMissionId === 'string' &&
    /^(00[1-9]|0[1-7][0-9]|080)$/.test(value.activeMissionId) &&
    (value.locale === 'en' || value.locale === 'id') &&
    Array.isArray(value.completedMissionIds) &&
    value.completedMissionIds.every((id: unknown) => typeof id === 'string') &&
    (value.endingId === null || typeof value.endingId === 'string')
  );
}
