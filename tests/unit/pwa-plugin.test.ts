import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { proofPwaOptions, pwaProof } from '../../tools/pwa-plugin.mjs';

it('discovers actual shell files with the existing security-pinned minimatch version', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import{globSync}from'glob';console.log(JSON.stringify(globSync('*.html',{cwd:process.cwd()})))",
    ],
    { encoding: 'utf8' },
  );
  expect(result.status, result.stderr).toBe(0);
  const matches: unknown = JSON.parse(result.stdout);
  expect(matches).toEqual(
    expect.arrayContaining([
      'index.html',
      'feasibility.html',
      'technical.html',
    ]),
  );
});
it('uses authored injectManifest with prompt control and no injected auto-registration', () => {
  expect(proofPwaOptions).toMatchObject({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: 'prompt',
    injectRegister: false,
  });
  expect(pwaProof().some((plugin) => plugin.name === 'vite-plugin-pwa')).toBe(
    true,
  );
});
it('excludes worker/binary/snapshot downloads from automatic shell installation', () => {
  expect(proofPwaOptions.injectManifest).toMatchObject({
    maximumFileSizeToCacheInBytes: 1_000_000,
    globIgnores: [
      '**/*.worker-*.js',
      '**/nodefs-*',
      '**/memfs2opfs-*',
      '**/opfs-ahp-*',
      '**/*.wasm',
      '**/*.data',
      '**/*.snapshot',
    ],
  });
});
