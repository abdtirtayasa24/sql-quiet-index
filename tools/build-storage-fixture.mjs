import { build } from 'vite';

// Browser-only test entry: never included in the production HTML/dist inputs.
await build({
  configFile: false,
  build: {
    outDir: 'generated/storage-fixture',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    lib: {
      entry: 'tests/fixtures/storage-browser.ts',
      formats: ['es'],
      fileName: () => 'fixture.js',
    },
  },
});
