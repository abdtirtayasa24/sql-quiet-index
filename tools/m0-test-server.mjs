// Test-only loopback static origin. Never deploy this control interface.
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { extname, join } from 'node:path';

mkdirSync('test-results', { recursive: true });
for (const version of ['a', 'b']) {
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      'build',
      '--outDir',
      `dist-m0-${version}`,
    ],
    {
      env: { ...process.env, TQI_PROOF_RELEASE: `test-${version}` },
      encoding: 'utf8',
      timeout: 60_000,
    },
  );
  writeFileSync(
    `test-results/m0-build-${version}.log`,
    result.stdout + result.stderr,
  );
  if (result.status !== 0)
    throw new Error(`M0 ${version} build failed: ${result.stderr}`);
  const check = spawnSync(
    process.execPath,
    ['tools/verify-m0-dist.mjs', `dist-m0-${version}`],
    { encoding: 'utf8' },
  );
  if (check.status !== 0) throw new Error(check.stderr);
}
let current = 'a';
let blocked = '';
let blockedHits = 0;
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.snapshot': 'application/octet-stream',
  '.png': 'image/png',
  '.txt': 'text/plain',
};
const csp =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const server = createServer((request, response) => {
  response.setHeader('Content-Security-Policy', csp);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  const path = new URL(request.url ?? '/', 'http://127.0.0.1:4174').pathname;
  if (path.startsWith('/__test/')) {
    if (path === '/__test/stats') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ blockedHits }));
      return;
    }
    if (request.method !== 'PUT') {
      response.writeHead(405).end();
      return;
    }
    if (path === '/__test/unblock') {
      blocked = '';
      response.end('unblocked');
      return;
    }
    if (path === '/__test/block-engine') {
      blocked =
        '/assets/' +
        readdirSync(`dist-m0-${current}/assets`).find((file) =>
          /^pglite-.*\.wasm$/.test(file),
        );
      response.end('blocked engine');
      return;
    }
    if (path === '/__test/block-next-shell') {
      blocked =
        '/assets/' +
        readdirSync('dist-m0-b/assets').find((file) =>
          /^technical-.*\.js$/.test(file),
        );
      response.end('blocked next shell');
      return;
    }
    if (path === '/__test/release') {
      let body = '';
      request.on('data', (chunk) => {
        body += chunk.toString();
        if (body.length > 8) request.destroy();
      });
      request.on('end', () => {
        if (body !== 'a' && body !== 'b') {
          response.writeHead(400).end();
          return;
        }
        current = body;
        if (body === 'a') {
          blocked = '';
          blockedHits = 0;
        }
        response.end(current);
      });
      return;
    }
    response.writeHead(404).end();
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end();
    return;
  }
  if (path === blocked) {
    blockedHits++;
    response.writeHead(404).end('missing new shell');
    return;
  }
  const safe = path === '/' ? '/index.html' : path;
  if (
    !/^\/(?:assets\/[A-Za-z0-9_.-]+|icons\/proof-(?:192|512)\.png|[A-Za-z0-9_.-]+)$/.test(
      safe,
    ) ||
    safe.includes('..')
  ) {
    response.writeHead(404).end();
    return;
  }
  let file = join(`dist-m0-${current}`, safe.slice(1));
  // Additive immutable hosting: old uncached objects survive mutable entry promotion.
  if (
    !existsSync(file) &&
    (safe.startsWith('/assets/') || safe.startsWith('/m0-assets-'))
  )
    file = join(`dist-m0-${current === 'a' ? 'b' : 'a'}`, safe.slice(1));
  if (!existsSync(file)) {
    response.writeHead(404).end('not found');
    return;
  }
  response.setHeader(
    'Content-Type',
    mime[extname(file)] ?? 'application/octet-stream',
  );
  // Keep HTTP caching disabled here: prove SW/retained assets, not an incidental HTTP cache hit.
  response.end(request.method === 'HEAD' ? undefined : readFileSync(file));
});
server.listen(4174, '127.0.0.1', () =>
  console.log('M0 A/B static artifact test origin on loopback 4174.'),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => server.close(() => process.exit(0)));
