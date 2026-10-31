import { PGlite } from '@electric-sql/pglite';
import { parseSql } from '../engine/pg-ast';
import { isEngineRequest } from '../engine/protocol';
import type {
  EngineRequest,
  EngineResponse,
  SmokeResult,
} from '../engine/protocol';

const probes = [
  ['version', 'SELECT version();'],
  [
    'date_trunc',
    "SELECT DATE_TRUNC('day', TIMESTAMPTZ '2028-11-04 13:21+07');",
  ],
  [
    'distinct_on',
    'SELECT DISTINCT ON (a) a,b FROM (VALUES (1,2),(1,3)) AS x(a,b) ORDER BY a,b DESC;',
  ],
  [
    'cte_window',
    'WITH t AS (SELECT 1 n) SELECT ROW_NUMBER() OVER (ORDER BY n) FROM t;',
  ],
  ['explain_json', 'EXPLAIN (FORMAT JSON) SELECT 1;'],
] as const;
let database: Promise<PGlite> | undefined;
async function runProbes(): Promise<SmokeResult[]> {
  const pg = await (database ??= PGlite.create({ dataDir: 'memory://' }));
  await pg.exec("SET TIME ZONE 'UTC';");
  const results: SmokeResult[] = [];
  for (const [name, sql] of probes) {
    const result = await pg.query<unknown[]>(sql, [], {
      rowMode: 'array',
      parsers: { 20: (text) => text, 1184: (text) => text },
    });
    results.push({
      name,
      fields: result.fields.map((field) => ({
        name: field.name,
        typeOid: field.dataTypeID,
      })),
      rows: result.rows,
    });
  }
  return results;
}
async function handle(request: EngineRequest): Promise<void> {
  let reply: EngineResponse;
  try {
    reply =
      request.type === 'PROBE'
        ? { ...request, type: 'PROBE_RESULT', results: await runProbes() }
        : {
            sessionId: request.sessionId,
            requestId: request.requestId,
            type: 'PARSE_RESULT',
            result: await parseSql(request.sql),
          };
  } catch {
    reply = {
      sessionId: request.sessionId,
      requestId: request.requestId,
      type: 'ERROR',
      message:
        'Engine probe unavailable. Reload to retry; no saved data was changed.',
    };
  }
  globalThis.postMessage(reply);
}
let queue = Promise.resolve();
let sessionId: string | undefined;
let lastRequestId = 0;
globalThis.addEventListener('message', (event: MessageEvent<unknown>) => {
  const request = event.data;
  if (!isEngineRequest(request)) return;
  sessionId ??= request.sessionId;
  if (request.sessionId !== sessionId || request.requestId <= lastRequestId)
    return;
  lastRequestId = request.requestId;
  queue = queue.then(() => handle(request));
});
