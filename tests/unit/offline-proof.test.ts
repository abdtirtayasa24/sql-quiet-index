import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  downloadProof,
  proofReady,
  readProofManifest,
} from '../../src/app/offline-proof';
import type { ProofCache } from '../../src/app/offline-proof';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const raw = {
  schema: 1,
  release: 'test-a',
  resources: [
    {
      url: '/assets/engine-test.wasm',
      bytes: 4,
      sha256: hash('wasm'),
      kind: 'engine',
    },
    { url: '/technical.html', bytes: 4, sha256: hash('html'), kind: 'shell' },
  ],
};
it('accepts only the explicit new workspace document in the bounded proof pack', () => {
  const workspace = {
    ...raw,
    resources: [{ ...raw.resources[1], url: '/workspace.html' }],
  };
  expect(readProofManifest(workspace, 'test-a').resources[0]?.url).toBe(
    '/workspace.html',
  );
  expect(() =>
    readProofManifest(
      {
        ...workspace,
        resources: [{ ...workspace.resources[0], url: '/unreviewed.html' }],
      },
      'test-a',
    ),
  ).toThrow();
});
function memoryCache(): ProofCache {
  const data = new Map<string, Response>();
  return {
    put: (url, response) => {
      data.set(url, response.clone());
      return Promise.resolve();
    },
    match: (url) => Promise.resolve(data.get(url)?.clone()),
    delete: (url) => Promise.resolve(data.delete(url)),
  };
}
it('marks only a complete verified pack ready, and detects subsequently missing assets', async () => {
  const manifest = readProofManifest(raw, 'test-a');
  const cache = memoryCache();
  expect(await proofReady(manifest, cache)).toBe(false);
  await downloadProof(manifest, cache, (url) =>
    Promise.resolve(
      new Response(
        typeof url === 'string' && url.endsWith('.wasm') ? 'wasm' : 'html',
      ),
    ),
  );
  expect(await proofReady(manifest, cache)).toBe(true);
  await cache.delete('/assets/engine-test.wasm');
  expect(await proofReady(manifest, cache)).toBe(false);
});
it('preserves worker CSP/nosniff while removing HTTP transfer encoding headers from decoded cached bytes', async () => {
  const manifest = readProofManifest(raw, 'test-a');
  const cache = memoryCache();
  await downloadProof(manifest, cache, (url) =>
    Promise.resolve(
      new Response(
        typeof url === 'string' && url.endsWith('.wasm') ? 'wasm' : 'html',
        {
          headers: {
            'Content-Security-Policy': "script-src 'self' 'wasm-unsafe-eval'",
            'X-Content-Type-Options': 'nosniff',
            'Content-Encoding': 'gzip',
            Vary: 'Origin, Accept-Encoding',
          },
        },
      ),
    ),
  );
  const cached = await cache.match('/assets/engine-test.wasm');
  expect(cached?.headers.get('content-security-policy')).toContain(
    "'wasm-unsafe-eval'",
  );
  expect(cached?.headers.get('x-content-type-options')).toBe('nosniff');
  expect(cached?.headers.has('content-encoding')).toBe(false);
  expect(cached?.headers.has('vary')).toBe(false);
});
it.each(['checksum', 'oversize', 'missing', 'quota'])(
  'never reports ready after %s failure',
  async (kind) => {
    const manifest = readProofManifest(raw, 'test-a');
    const cache = memoryCache();
    if (kind === 'quota')
      cache.put = () => Promise.reject(new Error('Quota exceeded'));
    const fetcher: typeof fetch = () =>
      Promise.resolve(
        kind === 'missing'
          ? new Response('', { status: 404 })
          : new Response(
              kind === 'checksum'
                ? 'evil'
                : kind === 'oversize'
                  ? 'too long'
                  : 'wasm',
            ),
      );
    await expect(downloadProof(manifest, cache, fetcher)).rejects.toThrow();
    expect(await proofReady(manifest, cache)).toBe(false);
  },
);
it.each([
  'https://evil.invalid/a.wasm',
  '/../secret',
  '/assets/../secret',
  '/assets/a.wasm?query=private',
])('rejects untrusted manifest path %s', (url) => {
  expect(() =>
    readProofManifest(
      { ...raw, resources: [{ ...raw.resources[0], url }] },
      'test-a',
    ),
  ).toThrow();
});
it('rejects wrong release, duplicate URLs, invalid hashes and oversized declared payloads', () => {
  expect(() => readProofManifest(raw, 'test-b')).toThrow();
  expect(() =>
    readProofManifest(
      { ...raw, resources: [raw.resources[0], raw.resources[0]] },
      'test-a',
    ),
  ).toThrow();
  expect(() =>
    readProofManifest(
      { ...raw, resources: [{ ...raw.resources[0], sha256: 'wrong' }] },
      'test-a',
    ),
  ).toThrow();
  expect(() =>
    readProofManifest(
      { ...raw, resources: [{ ...raw.resources[0], bytes: 100_000_000 }] },
      'test-a',
    ),
  ).toThrow();
});
