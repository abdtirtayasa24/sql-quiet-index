import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

// The pinned parser uses a runtime filename, invisible to Vite's asset graph.
// Transform only that verified expression; fail closed if upstream changes it.
function parserAsset(): Plugin {
  return {
    name: 'pinned-pg18-parser-asset',
    enforce: 'pre',
    transform(source, id) {
      if (!id.endsWith('/libpg-query/wasm/libpg-query.js')) return;
      const original = 'locateFile("libpg-query.wasm")';
      if (source.split(original).length !== 2)
        throw new Error(
          'Pinned parser loader changed; repeat T06 packaging audit.',
        );
      return {
        code: source.replace(
          original,
          "new URL('./libpg-query.wasm', import.meta.url).href",
        ),
        map: null,
      };
    },
  };
}

export default defineConfig({
  base: '/',
  preview: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
      'X-Content-Type-Options': 'nosniff',
    },
  },
  plugins: [
    {
      name: 'static-feasibility-policy',
      generateBundle() {
        const manifest = JSON.parse(
          readFileSync('tools/vendor-manifest.json', 'utf8'),
        ) as {
          packages: {
            name: string;
            version: string;
            license: string;
            files: Record<string, string>;
          }[];
        };
        const notices = manifest.packages
          .map((item) => {
            const files = Object.keys(item.files).filter((file) =>
              /^(LICENSE|COPYING|NOTICE)(\.|$)/i.test(file),
            );
            return `${item.name}@${item.version} — ${item.license}\n${files.map((file) => readFileSync(`node_modules/${item.name}/${file}`, 'utf8')).join('\n') || 'No standalone license text packaged upstream; see package metadata and upstream repository.'}`;
          })
          .join('\n\n---\n\n');
        this.emitFile({
          type: 'asset',
          fileName: 'THIRD_PARTY_NOTICES.txt',
          source: notices,
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.split('?')[0]?.endsWith('.data'))
            response.setHeader('Content-Type', 'application/octet-stream');
          next();
        });
      },
    },
  ],
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  worker: { format: 'es', plugins: () => [parserAsset()] },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { input: ['index.html', 'feasibility.html'] },
  },
});
