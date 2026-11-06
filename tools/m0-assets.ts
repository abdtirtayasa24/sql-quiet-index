import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

interface Artifact {
  fileName: string;
  bytes: string | Uint8Array;
}
export function describeAssets(artifacts: readonly Artifact[]) {
  return artifacts.map(({ fileName, bytes }) => {
    if (
      !/^(?:assets\/[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+)$/.test(fileName) ||
      fileName.includes('..')
    )
      throw new Error('Unsafe emitted artifact path.');
    return {
      url: `/${fileName}`,
      bytes: Buffer.byteLength(bytes),
      sha256: createHash('sha256').update(bytes).digest('hex'),
      kind: /(?:\.worker-|\.(?:wasm|data|snapshot)$|\/nodefs-|\/memfs2opfs-|\/opfs-ahp-)/.test(
        fileName,
      )
        ? 'engine'
        : 'shell',
    };
  });
}
export function m0Assets(release: string): Plugin {
  return {
    name: 'm0-pinned-proof-assets',
    enforce: 'post',
    // Vite finalizes module-preload code after generateBundle. Hash disk bytes
    // in writeBundle, before PWA's closeBundle scans/injects the final manifest.
    writeBundle(options, bundle) {
      if (!options.dir)
        throw new Error('M0 assets require a static output directory.');
      const artifacts = Object.values(bundle).filter((item) =>
        /^(?:assets\/.*\.(?:js|css|wasm|data|snapshot)|(?:index|feasibility|technical)\.html)$/.test(
          item.fileName,
        ),
      );
      const resources = describeAssets(
        artifacts.map((item) => ({
          fileName: item.fileName,
          bytes: readFileSync(join(options.dir!, item.fileName)),
        })),
      );
      writeFileSync(
        join(options.dir, `m0-assets-${release}.json`),
        JSON.stringify({ schema: 1, release, resources }, null, 2) + '\n',
      );
    },
  };
}
