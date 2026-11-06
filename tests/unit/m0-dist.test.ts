import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, it } from 'vitest';
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'tqi-m0-dist-'));
  dirs.push(dir);
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'assets/page-abc.js'), 'final bytes');
  writeFileSync(join(dir, 'sw.js'), 'injected shell only');
  writeFileSync(
    join(dir, 'm0-assets-test.json'),
    JSON.stringify({
      schema: 1,
      release: 'test',
      resources: [
        {
          url: '/assets/page-abc.js',
          bytes: 11,
          sha256: createHash('sha256').update('final bytes').digest('hex'),
        },
      ],
    }),
  );
  return dir;
}
function verify(dir: string) {
  return spawnSync(
    process.execPath,
    [resolve('tools/verify-m0-dist.mjs'), dir],
    { encoding: 'utf8' },
  );
}
it('accepts final bytes, not an intermediate chunk representation', () => {
  const result = verify(fixture());
  expect(result.status, result.stderr).toBe(0);
});
it.each(['post-processing', 'uninjected worker', 'binary precache'])(
  'rejects %s drift',
  (failure) => {
    const dir = fixture();
    if (failure === 'post-processing')
      writeFileSync(join(dir, 'assets/page-abc.js'), 'late Vite changes');
    else
      writeFileSync(
        join(dir, 'sw.js'),
        failure === 'uninjected worker'
          ? 'self.__WB_MANIFEST'
          : 'precache([{url:"assets/pg.wasm"}])',
      );
    expect(verify(dir).status).toBe(1);
  },
);
