import { isRecord } from './protocol';
import type { Identity } from './protocol';
export type WorkspaceCommand =
  { type: 'LOAD'; seed: string } | { type: 'RUN'; sql: string };
export type WorkspaceRequest = Identity & WorkspaceCommand;
export interface PracticeResult {
  readonly fields: readonly { name: string; typeOid: number }[];
  readonly rows: readonly (readonly (string | number | boolean | null)[])[];
  readonly rowCount: number;
}
export type WorkspaceReply = Identity &
  (
    | { type: 'LOADED'; seed: string }
    | { type: 'RESULT'; result: PracticeResult }
    | { type: 'FAILED'; code: string }
  );
function identity(value: Record<string, unknown>) {
  return (
    typeof value.sessionId === 'string' &&
    value.sessionId.length > 0 &&
    value.sessionId.length <= 128 &&
    typeof value.requestId === 'number' &&
    Number.isSafeInteger(value.requestId) &&
    value.requestId > 0
  );
}
export function isWorkspaceRequest(value: unknown): value is WorkspaceRequest {
  return (
    isRecord(value) &&
    identity(value) &&
    ((value.type === 'LOAD' &&
      typeof value.seed === 'string' &&
      /^[a-f0-9]{8,16}$/.test(value.seed)) ||
      (value.type === 'RUN' &&
        typeof value.sql === 'string' &&
        value.sql.length <= 12000))
  );
}
export function isWorkspaceReply(value: unknown): value is WorkspaceReply {
  if (!isRecord(value) || !identity(value)) return false;
  if (value.type === 'LOADED')
    return (
      typeof value.seed === 'string' && /^[a-f0-9]{8,16}$/.test(value.seed)
    );
  if (value.type === 'FAILED')
    return typeof value.code === 'string' && value.code.length <= 64;
  if (value.type !== 'RESULT' || !isRecord(value.result)) return false;
  const { fields, rows, rowCount } = value.result;
  if (
    !Array.isArray(fields) ||
    fields.length > 12 ||
    !Array.isArray(rows) ||
    rows.length > 200 ||
    typeof rowCount !== 'number' ||
    !Number.isSafeInteger(rowCount) ||
    rowCount < rows.length ||
    rowCount > 1000
  )
    return false;
  return (
    fields.every(
      (f: unknown) =>
        isRecord(f) &&
        typeof f.name === 'string' &&
        f.name.length <= 256 &&
        typeof f.typeOid === 'number' &&
        Number.isSafeInteger(f.typeOid) &&
        f.typeOid > 0,
    ) &&
    rows.every(
      (r: unknown) =>
        Array.isArray(r) &&
        r.length === fields.length &&
        r.every(
          (v: unknown) =>
            v === null ||
            typeof v === 'boolean' ||
            (typeof v === 'number' &&
              Number.isFinite(v) &&
              (!Number.isInteger(v) || Number.isSafeInteger(v))) ||
            (typeof v === 'string' && v.length <= 4096),
        ),
    )
  );
}
