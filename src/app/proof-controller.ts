import {
  boundedBytes,
  proofCacheName,
  proofReady,
  readProofManifest,
} from './offline-proof';
import type { ProofManifest } from './offline-proof';
import { UpdateController } from './update-controller';
import { requestProofDownload } from './sw-download';

declare const __M0_RELEASE__: string;
export class ProofController {
  status = 'Installing the lean offline shell…';
  busy = false;
  starting = false;
  available = false;
  update: UpdateController | undefined;
  private manifest: ProofManifest | undefined;
  private worker: ServiceWorker | undefined;
  private readonly abort = new AbortController();
  constructor(private readonly changed: () => void) {}
  private notify() {
    if (!this.abort.signal.aborted) this.changed();
  }
  async start() {
    if (this.starting || this.abort.signal.aborted) return;
    this.starting = true;
    this.notify();
    try {
      if (!('serviceWorker' in navigator) || !('caches' in globalThis))
        throw new Error('Offline proof unsupported');
      const registration =
        (await navigator.serviceWorker.getRegistration('/')) ??
        (await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none',
        }));
      if (!registration.active) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => {
              timer = setTimeout(
                () => reject(new Error('Shell install deadline')),
                20_000,
              );
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
      }
      if (this.abort.signal.aborted) return;
      this.worker = registration.active ?? undefined;
      if (!this.worker) throw new Error('No active offline worker');
      this.update?.dispose();
      this.update = new UpdateController(registration, () => this.notify());
      const response = await fetch(`/m0-assets-${__M0_RELEASE__}.json`, {
        signal: this.abort.signal,
      });
      const value: unknown = JSON.parse(
        new TextDecoder().decode(await boundedBytes(response, 128 * 1024)),
      );
      this.manifest = readProofManifest(value, __M0_RELEASE__);
      const cache = await caches.open(proofCacheName(__M0_RELEASE__));
      this.status = (await proofReady(this.manifest, cache))
        ? 'PG/parser proof available offline. No missions or saves are included.'
        : 'Shell installed. PG/parser binaries are not offline yet.';
      this.available = true;
    } catch {
      this.status =
        'Offline setup unavailable. Retry online; no saved data changed.';
    }
    this.starting = false;
    this.notify();
  }
  async download() {
    if (!this.manifest || !this.worker || this.busy) return;
    this.busy = true;
    this.status =
      'Downloading and verifying every proof asset. Not offline ready yet…';
    this.notify();
    try {
      const cache = await caches.open(proofCacheName(this.manifest.release));
      await requestProofDownload(
        this.worker,
        this.manifest.release,
        this.abort.signal,
      );
      if (!(await proofReady(this.manifest, cache)))
        throw new Error('Incomplete offline pack');
      this.status =
        'PG/parser proof available offline. No missions or saves are included.';
    } catch {
      this.status =
        'Offline download incomplete (network, checksum or storage failure). Retry online; no saved data changed.';
    } finally {
      this.busy = false;
      this.notify();
    }
  }
  dispose() {
    this.abort.abort();
    this.update?.dispose();
  }
}
