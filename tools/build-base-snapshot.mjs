import { PGlite } from '@electric-sql/pglite';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const outputIndex = process.argv.indexOf('--output');
const output = resolve(
  outputIndex < 0 ? 'generated' : process.argv[outputIndex + 1],
);
const seed = readFileSync('src/engine/benchmark-seed.sql');
const engine = JSON.parse(
  readFileSync('node_modules/@electric-sql/pglite/package.json', 'utf8'),
);
const coupling = {
  schema: 1,
  engineVersion: engine.version,
  engineWasmSha256: sha(
    readFileSync('node_modules/@electric-sql/pglite/dist/pglite.wasm'),
  ),
  seedSha256: sha(seed),
};
// An opaque extension prevents static hosts treating the archive as HTTP Content-Encoding.
const archive = join(output, 'base.snapshot');
const descriptor = join(output, 'base-snapshot.json');
function verify() {
  const metadata = JSON.parse(readFileSync(descriptor, 'utf8'));
  for (const [key, expected] of Object.entries(coupling)) {
    if (metadata[key] !== expected)
      throw new Error(`Snapshot coupling mismatch: ${key}`);
  }
  const bytes = readFileSync(archive);
  if (
    bytes.length > 20 * 1024 * 1024 ||
    metadata.snapshotSha256 !== sha(bytes) ||
    !metadata.postgresVersion?.startsWith('PostgreSQL 18.')
  )
    throw new Error('Snapshot bytes/version mismatch.');
  return metadata;
}
try {
  if (engine.version !== '0.5.13')
    throw new Error('Snapshot requires exact approved PGlite 0.5.13.');
  if (process.argv.includes('--verify')) verify();
  else {
    let reusable = false;
    if (existsSync(descriptor) && existsSync(archive)) {
      try {
        verify();
        reusable = true;
      } catch {
        /* Source coupling changed: generate a new candidate, never certify old bytes. */
      }
    }
    if (!reusable) {
      const pg = await PGlite.create({ dataDir: 'memory://' });
      try {
        await pg.exec(seed.toString('utf8'));
        const version = await pg.query('SELECT version() AS version');
        const postgresVersion = version.rows[0]?.version;
        if (
          typeof postgresVersion !== 'string' ||
          !postgresVersion.startsWith('PostgreSQL 18.')
        )
          throw new Error('Expected PostgreSQL 18.');
        const bytes = Buffer.from(
          await (await pg.dumpDataDir('gzip')).arrayBuffer(),
        );
        mkdirSync(output, { recursive: true });
        writeFileSync(archive, bytes);
        writeFileSync(
          descriptor,
          JSON.stringify(
            { ...coupling, postgresVersion, snapshotSha256: sha(bytes) },
            null,
            2,
          ) + '\n',
        );
      } finally {
        await pg.close();
      }
    }
    verify();
  }
  console.log(
    'Snapshot verified: PGlite 0.5.13 / PG18, WASM + seed + archive SHA-256. Benchmark candidate only.',
  );
} catch (error) {
  console.error(
    'Snapshot verification failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
