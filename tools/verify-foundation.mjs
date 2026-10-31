import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Foundation-only artifact check. Full content/PWA/vendor verification lands later.
try {
  const directory = resolve(process.argv[2] ?? 'dist');
  const files = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
  const html = readFileSync(join(directory, 'index.html'), 'utf8');
  if (
    files.some((file) =>
      /(?:^|[/\\])\.|\.(?:pem|key|ts|mjs)$/i.test(file.slice(directory.length)),
    )
  ) {
    throw new Error(
      'Private material or authored source found in deployable output.',
    );
  }
  if (
    !html.includes('type="module"') ||
    !files.some((file) => file.endsWith('.js')) ||
    !files.some((file) => file.endsWith('.css'))
  ) {
    throw new Error('Missing module entry or emitted JavaScript/CSS.');
  }
  console.log(
    `Foundation static artifact check passed (${files.length} files). Not a full release certification.`,
  );
} catch (error) {
  console.error(
    'Foundation artifact check failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
