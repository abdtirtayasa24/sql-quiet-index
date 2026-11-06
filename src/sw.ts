import { setCacheNameDetails } from 'workbox-core/setCacheNameDetails.js';
import { getCacheKeyForURL } from 'workbox-precaching/getCacheKeyForURL.js';
import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute.js';
import {
  boundedBytes,
  downloadProof,
  proofCacheName,
  proofReady,
  readProofManifest,
} from './app/offline-proof';
import { isRecord } from './engine/protocol';

// Separately type-checked against WebWorker, never DOM + WebWorker combined.
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string; revision: string | null }[];
};
declare const __M0_RELEASE__: string;
setCacheNameDetails({ prefix: 'tqi-m0', suffix: __M0_RELEASE__ });
precacheAndRoute(self.__WB_MANIFEST);

let pendingDownload: Promise<void> | undefined;
async function cacheProof() {
  const url = `/m0-assets-${__M0_RELEASE__}.json`;
  const response = (await caches.match(url)) ?? (await fetch(url));
  const value: unknown = JSON.parse(
    new TextDecoder().decode(await boundedBytes(response, 128 * 1024)),
  );
  const manifest = readProofManifest(value, __M0_RELEASE__);
  const cache = await caches.open(proofCacheName(__M0_RELEASE__));
  if (!(await proofReady(manifest, cache))) {
    const deadline = AbortSignal.timeout(120_000);
    await downloadProof(manifest, cache, (url, options) =>
      fetch(url, {
        ...options,
        signal: AbortSignal.any([deadline, AbortSignal.timeout(30_000)]),
      }),
    );
  }
}
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const message: unknown = event.data;
  if (
    !isRecord(message) ||
    !event.source ||
    !('url' in event.source) ||
    new URL(event.source.url).origin !== self.location.origin
  )
    return;
  if (message.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (message.type === 'DOWNLOAD_PROOF' && event.ports[0]) {
    const port = event.ports[0];
    event.waitUntil(
      (async () => {
        try {
          if (message.release !== __M0_RELEASE__)
            throw new Error('Release mismatch');
          pendingDownload ??= cacheProof().finally(() => {
            pendingDownload = undefined;
          });
          await pendingDownload;
          port.postMessage({
            type: 'PROOF_DOWNLOADED',
            release: __M0_RELEASE__,
          });
        } catch {
          port.postMessage({
            type: 'PROOF_DOWNLOAD_FAILED',
            release: __M0_RELEASE__,
          });
        } finally {
          port.close();
        }
      })(),
    );
  }
});
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !/^\/(?:assets\/[A-Za-z0-9_.-]+|m0-assets-[A-Za-z0-9-]+\.json)$/.test(
      url.pathname,
    ) ||
    getCacheKeyForURL(event.request.url)
  )
    return;
  event.respondWith(
    (async () => {
      // Keep old immutable objects usable by a non-reloaded old tab after approval in another tab.
      // Explicit downloads are SW-owned fetches, so no page-request cache bypass is needed.
      for (const name of await caches.keys()) {
        if (!name.startsWith('tqi-m0-')) continue;
        const cached = await (await caches.open(name)).match(event.request);
        if (cached) return cached;
      }
      return fetch(event.request);
    })(),
  );
});
// No clientsClaim, unconditional skipWaiting, cache pruning, or player-storage access.
// Cache lifecycle/eviction hardening is T33–T34; M0 never deletes an old client's assets.
