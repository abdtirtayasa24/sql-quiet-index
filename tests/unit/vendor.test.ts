import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { isRecord } from '../../src/engine/protocol';

const directories: string[] = [];
afterEach(() => {
  for (const path of directories.splice(0))
    rmSync(path, { recursive: true, force: true });
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tqi-vendor-'));
  directories.push(root);
  const packages = [
    {
      name: '@electric-sql/pglite',
      version: '0.5.13',
      license: 'Apache-2.0',
      integrity: 'sha512-pg',
      files: {} as Record<string, string>,
    },
    {
      name: 'libpg-query',
      version: '18.2.2',
      license: 'MIT',
      integrity: 'sha512-parser',
      files: {} as Record<string, string>,
    },
  ];
  for (const item of packages) {
    const directory = join(root, 'node_modules', item.name);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'package.json'), JSON.stringify(item));
    for (const [file, bytes] of [
      ['artifact.wasm', 'original-bytes'],
      ['LICENSE', 'License text'],
    ] as const) {
      writeFileSync(join(directory, file), bytes);
      item.files[file] = createHash('sha256').update(bytes).digest('hex');
    }
  }
  mkdirSync(join(root, 'tools'));
  writeFileSync(
    join(root, 'tools/vendor-manifest.json'),
    JSON.stringify({ packages }),
  );
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      dependencies: Object.fromEntries(
        packages.map((item) => [item.name, item.version]),
      ),
    }),
  );
  writeFileSync(
    join(root, 'package-lock.json'),
    JSON.stringify({
      packages: Object.fromEntries(
        packages.map((item) => [
          `node_modules/${item.name}`,
          { version: item.version, integrity: item.integrity },
        ]),
      ),
    }),
  );
  return root;
}
function verify(root: string, ...args: string[]) {
  return spawnSync(
    process.execPath,
    [resolve('tools/verify-third-party.mjs'), root, ...args],
    { encoding: 'utf8' },
  );
}
it('accepts independently recorded artifact hashes, package pins, licenses and lock integrity', () => {
  const result = verify(fixture());
  expect(result.status, result.stderr).toBe(0);
});
it.each(['checksum', 'license', 'pin', 'lock integrity', 'missing file'])(
  'fails on deliberate %s drift',
  (failure) => {
    const root = fixture();
    const directory = join(root, 'node_modules/libpg-query');
    if (failure === 'checksum')
      writeFileSync(join(directory, 'artifact.wasm'), 'tampered');
    if (failure === 'missing file') rmSync(join(directory, 'artifact.wasm'));
    if (failure === 'license' || failure === 'pin') {
      const metadata: unknown = JSON.parse(
        readFileSync(join(directory, 'package.json'), 'utf8'),
      );
      if (!isRecord(metadata)) throw new Error('Invalid test metadata');
      metadata[failure === 'license' ? 'license' : 'version'] = 'changed';
      writeFileSync(join(directory, 'package.json'), JSON.stringify(metadata));
    }
    if (failure === 'lock integrity')
      writeFileSync(join(root, 'package-lock.json'), '{"packages":{}}');
    const result = verify(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Vendor verification failed');
  },
);

function distributeFixture(root: string) {
  mkdirSync(join(root, 'dist/assets'), { recursive: true });
  writeFileSync(join(root, 'dist/assets/artifact-test.wasm'), 'original-bytes');
  writeFileSync(
    join(root, 'dist/THIRD_PARTY_NOTICES.txt'),
    '@electric-sql/pglite@0.5.13\nlibpg-query@18.2.2',
  );
}
it('verifies deployed binary bytes and notice coverage independently of filenames', () => {
  const root = fixture();
  distributeFixture(root);
  const result = verify(root, '--dist');
  expect(result.status, result.stderr).toBe(0);
});
it.each(['binary', 'notice'])('rejects altered distribution %s', (failure) => {
  const root = fixture();
  distributeFixture(root);
  writeFileSync(
    join(
      root,
      failure === 'binary'
        ? 'dist/assets/artifact-test.wasm'
        : 'dist/THIRD_PARTY_NOTICES.txt',
    ),
    'tampered',
  );
  const result = verify(root, '--dist');
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(
    failure === 'binary'
      ? 'altered emitted binary'
      : 'Missing distributed notice',
  );
});
