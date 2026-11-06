import { isRecord } from '../engine/protocol';

export interface ProofResource {
  url: string;
  bytes: number;
  sha256: string;
  kind: 'shell' | 'engine';
}
export interface ProofManifest {
  schema: 1;
  release: string;
  resources: ProofResource[];
}
export interface ProofCache {
  put(url: string, response: Response): Promise<void>;
  match(url: string): Promise<Response | undefined>;
  delete(url: string): Promise<boolean>;
}
export const proofCacheName = (release: string) => `tqi-m0-pack-${release}`;
const marker = '/m0-proof-complete';
export function readProofManifest(
  value: unknown,
  release: string,
): ProofManifest {
  if (
    !isRecord(value) ||
    value.schema !== 1 ||
    value.release !== release ||
    !/^[a-zA-Z0-9-]{1,80}$/.test(release) ||
    !Array.isArray(value.resources) ||
    !value.resources.length ||
    value.resources.length > 64
  )
    throw new Error('Invalid proof manifest.');
  const resources: ProofResource[] = [];
  for (const entry of value.resources as unknown[]) {
    if (
      !isRecord(entry) ||
      typeof entry.url !== 'string' ||
      !/^\/(?:assets\/[A-Za-z0-9_.-]+|(?:index|feasibility|technical)\.html)$/.test(
        entry.url,
      ) ||
      entry.url.includes('..') ||
      typeof entry.bytes !== 'number' ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes < 1 ||
      entry.bytes > 20 * 1024 * 1024 ||
      typeof entry.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      (entry.kind !== 'shell' && entry.kind !== 'engine')
    )
      throw new Error('Invalid proof resource.');
    resources.push({
      url: entry.url,
      bytes: entry.bytes,
      sha256: entry.sha256,
      kind: entry.kind,
    });
  }
  if (
    new Set(resources.map((entry) => entry.url)).size !== resources.length ||
    resources.reduce((sum, entry) => sum + entry.bytes, 0) > 40 * 1024 * 1024
  )
    throw new Error('Duplicate/oversized proof pack.');
  return { schema: 1, release, resources };
}
export async function boundedBytes(
  response: Response,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!response.ok || response.redirected || !response.body)
    throw new Error('Required proof asset unavailable.');
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error('Proof asset exceeds its byte ceiling.');
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}
export async function downloadProof(
  manifest: ProofManifest,
  cache: ProofCache,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  await cache.delete(marker);
  for (const entry of manifest.resources) {
    const response = await fetcher(entry.url, {
      cache: 'reload',
      redirect: 'error',
      credentials: 'same-origin',
    });
    const bytes = await boundedBytes(response, entry.bytes);
    const hash = [
      ...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    ]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
    if (bytes.byteLength !== entry.bytes || hash !== entry.sha256)
      throw new Error('Proof asset checksum mismatch. Retry online.');
    const headers = new Headers(response.headers);
    headers.delete('Content-Encoding');
    headers.delete('Content-Length');
    // Verified canonical bytes no longer vary by HTTP Origin/encoding negotiation.
    // Keep security/MIME headers, not delivery variants that make worker cache hits miss.
    headers.delete('Vary');
    await cache.put(entry.url, new Response(bytes, { headers }));
  }
  await cache.put(marker, new Response(manifest.release));
}
export async function proofReady(
  manifest: ProofManifest,
  cache: ProofCache,
): Promise<boolean> {
  if ((await (await cache.match(marker))?.text()) !== manifest.release)
    return false;
  for (const entry of manifest.resources)
    if (!(await cache.match(entry.url))) return false;
  return true;
}
