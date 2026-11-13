import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Native PG/WASM fixtures and snapshot subprocesses share the runner's memory.
    maxWorkers: 2,
    include: ['tests/unit/**/*.test.ts'],
    passWithNoTests: false,
    restoreMocks: true,
  },
});
