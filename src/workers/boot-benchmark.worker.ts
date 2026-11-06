import { PGlite } from '@electric-sql/pglite';
import seed from '../engine/benchmark-seed.sql?raw';
import descriptor from '../../generated/base-snapshot.json?raw';
import { isRecord } from '../engine/protocol';
import { parseSql } from '../engine/pg-ast';
import type { BootResult, BootStrategy } from '../engine/boot-benchmark';

declare const __M0_RELEASE__: string;

const sha = async (bytes: ArrayBuffer) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
let used = false;
globalThis.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (used || (event.data !== 'initdb' && event.data !== 'snapshot')) return;
  used = true;
  void run(event.data).catch(() => globalThis.postMessage({ error: true }));
});
async function run(strategy: BootStrategy) {
  const start = performance.now();
  let loadDataDir: Blob | undefined;
  if (strategy === 'snapshot') {
    const metadata: unknown = JSON.parse(descriptor);
    if (
      !isRecord(metadata) ||
      metadata.schema !== 1 ||
      metadata.engineVersion !== '0.5.13' ||
      metadata.seedSha256 !== (await sha(new TextEncoder().encode(seed).buffer))
    )
      throw new Error('Snapshot coupling mismatch');
    const response = await fetch(
      new URL('../../generated/base.snapshot', import.meta.url),
    );
    if (!response.ok) throw new Error('Snapshot unavailable');
    const bytes = await response.arrayBuffer();
    if (
      bytes.byteLength > 20 * 1024 * 1024 ||
      (await sha(bytes)) !== metadata.snapshotSha256
    )
      throw new Error('Snapshot checksum mismatch');
    loadDataDir = new Blob([bytes]);
  }
  const pg = await PGlite.create({
    dataDir: 'memory://',
    ...(loadDataDir ? { loadDataDir } : {}),
  });
  try {
    if (strategy === 'initdb') await pg.exec(seed);
    const sql =
      'SELECT COUNT(*)::text AS rows, SUM(record_id)::text AS sum FROM benchmark_records';
    const parsed = await parseSql(sql);
    if (!parsed.ok || parsed.version !== 180004)
      throw new Error('Parser proof failed');
    const result = await pg.query<{ rows: string; sum: string }>(sql);
    const version = await pg.query<{ version: string }>(
      'SELECT version() AS version',
    );
    const row = result.rows[0];
    const pgVersion = version.rows[0]?.version;
    if (!row || !pgVersion) throw new Error('Fixture unavailable');
    const reply: BootResult = {
      release: __M0_RELEASE__,
      strategy,
      pgVersion,
      ...row,
      workerMs: performance.now() - start,
      engineWasmBytes: pg.Module.wasmMemory.buffer.byteLength,
      resources: performance
        .getEntriesByType('resource')
        .filter(
          (entry): entry is PerformanceResourceTiming =>
            entry instanceof PerformanceResourceTiming,
        )
        .map((entry) => ({
          url: entry.name,
          transferBytes: entry.transferSize,
          encodedBytes: entry.encodedBodySize,
          decodedBytes: entry.decodedBodySize,
        })),
    };
    globalThis.postMessage(reply);
  } finally {
    await pg.close();
  }
}
