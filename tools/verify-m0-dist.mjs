import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

try {
  const root = resolve(process.argv[2] ?? 'dist');
  const names = readdirSync(root).filter((name) =>
    /^m0-assets-[A-Za-z0-9-]+\.json$/.test(name),
  );
  if (names.length !== 1)
    throw new Error('Expected exactly one pinned proof manifest.');
  const manifest = JSON.parse(readFileSync(join(root, names[0]), 'utf8'));
  if (
    manifest.schema !== 1 ||
    names[0] !== `m0-assets-${manifest.release}.json` ||
    !Array.isArray(manifest.resources) ||
    !manifest.resources.length
  )
    throw new Error('Invalid proof manifest.');
  const seen = new Set();
  for (const entry of manifest.resources) {
    if (
      typeof entry.url !== 'string' ||
      !/^\/(?:assets\/[A-Za-z0-9_.-]+|(?:index|feasibility|technical|workspace)\.html)$/.test(
        entry.url,
      ) ||
      entry.url.includes('..') ||
      seen.has(entry.url)
    )
      throw new Error('Unsafe/duplicate artifact URL.');
    seen.add(entry.url);
    const bytes = readFileSync(join(root, entry.url.slice(1)));
    if (
      bytes.length !== entry.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== entry.sha256
    )
      throw new Error(`Final artifact checksum mismatch: ${entry.url}`);
  }
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  if (
    sw.includes('__WB_MANIFEST') ||
    /["'][^"']+\.(?:wasm|data|snapshot)["']/.test(sw)
  )
    throw new Error('Uninjected worker or unconditional binary precache.');
  console.log(
    `M0 final artifact gate passed: ${seen.size} byte/hash-verified resources and injected lean SW. Not device/host acceptance.`,
  );
} catch (error) {
  console.error(
    'M0 artifact verification failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
