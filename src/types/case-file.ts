import type { Campaign, MissionState, SaveRow } from './save';
export type CaseCollections = {
  campaigns: Campaign[];
  missionStates: MissionState[];
  attempts: SaveRow[];
  evidence: SaveRow[];
  notes: SaveRow[];
  conceptEvents: SaveRow[];
  verdicts: SaveRow[];
};
export type CaseFile = CaseCollections & {
  format: 'the-quiet-index-save';
  saveVersion: 1;
  exportedAt: string;
  appVersion: string;
  integrity: { algorithm: 'SHA-256'; payloadHex: string };
};
export type ImportCode =
  | 'size'
  | 'json'
  | 'complexity'
  | 'pollution'
  | 'schema'
  | 'future'
  | 'integrity'
  | 'references'
  | 'identity'
  | 'confirmation'
  | 'capacity';
export class ImportFailure extends Error {
  constructor(readonly code: ImportCode) {
    super(code);
    this.name = 'ImportFailure';
  }
}
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
