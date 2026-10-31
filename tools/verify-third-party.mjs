import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(
  process.argv[2] && process.argv[2] !== '--dist' ? process.argv[2] : '.',
);
const json = (file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
try {
  const manifest = json('tools/vendor-manifest.json');
  const lock = json('package-lock.json');
  const project = json('package.json');
  if (!Array.isArray(manifest.packages) || manifest.packages.length < 2)
    throw new Error('Missing vendor baseline.');
  for (const [name, version] of [
    ['@electric-sql/pglite', '0.5.13'],
    ['libpg-query', '18.2.2'],
  ]) {
    if (
      project.dependencies[name] !== version ||
      !manifest.packages.some(
        (item) =>
          item.name === name &&
          item.version === version &&
          Object.keys(item.files).some((file) => /LICENSE/i.test(file)),
      )
    )
      throw new Error(`Missing exact pin/license baseline: ${name}`);
  }
  const expected = new Set(
    manifest.packages.map((item) => `node_modules/${item.name}`),
  );
  for (const [path, item] of Object.entries(lock.packages)) {
    if (path && !item.dev && !expected.has(path))
      throw new Error(`Unreviewed runtime package: ${path}`);
  }
  const built = process.argv.includes('--dist');
  const assets = built ? readdirSync(join(root, 'dist/assets')) : [];
  const notices = built
    ? readFileSync(join(root, 'dist/THIRD_PARTY_NOTICES.txt'), 'utf8')
    : '';
  let count = 0;
  for (const item of manifest.packages) {
    const directory = `node_modules/${item.name}`;
    const installed = json(`${directory}/package.json`);
    const locked = lock.packages[directory];
    if (
      installed.name !== item.name ||
      installed.version !== item.version ||
      installed.license !== item.license ||
      locked?.version !== item.version ||
      locked?.integrity !== item.integrity ||
      typeof item.integrity !== 'string'
    )
      throw new Error(`Package/license/lock drift: ${item.name}`);
    if (Object.keys(item.files).length === 0)
      throw new Error(`Empty baseline: ${item.name}`);
    for (const [file, checksum] of Object.entries(item.files)) {
      if (file.includes('..') || file.startsWith('/') || file.includes('\\'))
        throw new Error('Invalid baseline path.');
      if (digest(readFileSync(join(root, directory, file))) !== checksum)
        throw new Error(`Checksum mismatch: ${item.name}/${file}`);
      if (built && /\.(wasm|data)$/.test(file)) {
        const name = basename(file);
        const extension = name.slice(name.lastIndexOf('.'));
        const prefix = name.slice(0, -extension.length) + '-';
        const matches = assets.filter(
          (asset) => asset.startsWith(prefix) && asset.endsWith(extension),
        );
        if (
          matches.length !== 1 ||
          digest(readFileSync(join(root, 'dist/assets', matches[0]))) !==
            checksum
        )
          throw new Error(`Missing or altered emitted binary: ${name}`);
      }
      count++;
    }
    if (built && !notices.includes(`${item.name}@${item.version}`))
      throw new Error(`Missing distributed notice: ${item.name}`);
  }
  console.log(
    `Vendor verification passed: ${manifest.packages.length} packages, ${count} independent SHA-256 file checks${built ? ', emitted binaries and notices verified' : ''}.`,
  );
} catch (error) {
  console.error(
    'Vendor verification failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
