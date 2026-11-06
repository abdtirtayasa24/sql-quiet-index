import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { isRecord } from '../../src/engine/protocol';

const directories: string[] = [];
afterEach(() => {
  for (const dir of directories.splice(0))
    rmSync(dir, { recursive: true, force: true });
});
function build() {
  const dir = mkdtempSync(join(tmpdir(), 'tqi-snapshot-'));
  directories.push(dir);
  const result = run(dir);
  expect(result.status, result.stderr).toBe(0);
  return dir;
}
function run(dir: string, verify = false) {
  return spawnSync(
    process.execPath,
    [
      resolve('tools/build-base-snapshot.mjs'),
      '--output',
      dir,
      ...(verify ? ['--verify'] : []),
    ],
    { encoding: 'utf8', timeout: 30_000 },
  );
}
it('builds one PG18 gzip snapshot with independently verifiable engine and seed coupling', () => {
  const dir = build();
  const bytes = readFileSync(join(dir, 'base.snapshot'));
  expect([...bytes.subarray(0, 2)]).toEqual([31, 139]);
  const metadata: unknown = JSON.parse(
    readFileSync(join(dir, 'base-snapshot.json'), 'utf8'),
  );
  expect(metadata).toMatchObject({
    schema: 1,
    engineVersion: '0.5.13',
    snapshotSha256: createHash('sha256').update(bytes).digest('hex'),
    seedSha256: createHash('sha256')
      .update(readFileSync('src/engine/benchmark-seed.sql'))
      .digest('hex'),
  });
  expect(isRecord(metadata) ? metadata.postgresVersion : undefined).toContain(
    'PostgreSQL 18.',
  );
  expect(run(dir, true).status).toBe(0);
});
it.each(['bytes', 'engine coupling'])(
  'verification fails rather than repairing altered %s',
  (kind) => {
    const dir = build();
    if (kind === 'bytes') writeFileSync(join(dir, 'base.snapshot'), 'changed');
    else {
      const file = join(dir, 'base-snapshot.json');
      writeFileSync(
        file,
        readFileSync(file, 'utf8').replace('0.5.13', '0.5.12'),
      );
    }
    const result = run(dir, true);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Snapshot verification failed');
  },
);
