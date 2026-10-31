export interface Identity {
  readonly sessionId: string;
  readonly requestId: number;
}
export type EngineCommand = { type: 'PROBE' } | { type: 'PARSE'; sql: string };
export type EngineRequest = Identity & EngineCommand;
export interface SmokeResult {
  name: string;
  fields: { name: string; typeOid: number }[];
  rows: unknown[][];
}
export interface AstObservation {
  kind: string;
  path: string;
}
export type ParseOutcome =
  | {
      ok: true;
      version: number;
      statements: string[];
      observations: AstObservation[];
    }
  | { ok: false; message: string; cursorPosition?: number };
export type EngineResponse = Identity &
  (
    | { type: 'PROBE_RESULT'; results: SmokeResult[] }
    | { type: 'PARSE_RESULT'; result: ParseOutcome }
    | { type: 'ERROR'; message: string }
  );

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function hasIdentity(value: Record<string, unknown>): boolean {
  return (
    typeof value.sessionId === 'string' &&
    value.sessionId.length > 0 &&
    value.sessionId.length <= 128 &&
    Number.isSafeInteger(value.requestId) &&
    typeof value.requestId === 'number' &&
    value.requestId > 0
  );
}
export function isEngineRequest(value: unknown): value is EngineRequest {
  return (
    isRecord(value) &&
    hasIdentity(value) &&
    (value.type === 'PROBE' ||
      (value.type === 'PARSE' &&
        typeof value.sql === 'string' &&
        value.sql.length <= 12_000))
  );
}
function isParseOutcome(value: unknown): value is ParseOutcome {
  if (!isRecord(value)) return false;
  if (value.ok === false)
    return (
      typeof value.message === 'string' &&
      (value.cursorPosition === undefined ||
        (Number.isInteger(value.cursorPosition) &&
          typeof value.cursorPosition === 'number' &&
          value.cursorPosition >= 0))
    );
  return (
    value.ok === true &&
    typeof value.version === 'number' &&
    Array.isArray(value.statements) &&
    value.statements.every((kind: unknown) => typeof kind === 'string') &&
    Array.isArray(value.observations) &&
    value.observations.every(
      (node: unknown) =>
        isRecord(node) &&
        typeof node.kind === 'string' &&
        typeof node.path === 'string',
    )
  );
}
function isSmokeResult(value: unknown): value is SmokeResult {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.fields)
  )
    return false;
  const width = value.fields.length;
  return (
    value.fields.every(
      (field: unknown) =>
        isRecord(field) &&
        typeof field.name === 'string' &&
        typeof field.typeOid === 'number',
    ) &&
    Array.isArray(value.rows) &&
    value.rows.length <= 1000 &&
    value.rows.every(
      (row: unknown) => Array.isArray(row) && row.length === width,
    )
  );
}
export function isEngineResponse(value: unknown): value is EngineResponse {
  if (!isRecord(value) || !hasIdentity(value)) return false;
  switch (value.type) {
    case 'PROBE_RESULT':
      return (
        Array.isArray(value.results) &&
        value.results.length <= 10 &&
        value.results.every(isSmokeResult)
      );
    case 'PARSE_RESULT':
      return isParseOutcome(value.result);
    case 'ERROR':
      return typeof value.message === 'string';
    default:
      return false;
  }
}
