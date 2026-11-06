import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { describeAssets } from '../../tools/m0-assets';

it('hashes actual artifact bytes and separates lean shell from opt-in engine assets', () => {
  const resources = describeAssets([
    { fileName: 'technical.html', bytes: 'shell' },
    { fileName: 'assets/technical-abc.js', bytes: 'page' },
    { fileName: 'assets/postgres.worker-abc.js', bytes: 'worker' },
    {
      fileName: 'assets/pglite-abc.wasm',
      bytes: new Uint8Array([0, 97, 115, 109]),
    },
    { fileName: 'assets/base.snapshot-abc.snapshot', bytes: 'gzip archive' },
  ]);
  expect(resources).toHaveLength(5);
  expect(resources[0]).toMatchObject({
    url: '/technical.html',
    bytes: 5,
    sha256: createHash('sha256').update('shell').digest('hex'),
    kind: 'shell',
  });
  expect(resources.slice(2).every((item) => item.kind === 'engine')).toBe(true);
});
it.each([
  '../private.js',
  '/absolute.js',
  'assets/../private.js',
  'assets/private.js?token=1',
])('rejects unsafe emitted path %s', (fileName) => {
  expect(() => describeAssets([{ fileName, bytes: 'not safe' }])).toThrow();
});
