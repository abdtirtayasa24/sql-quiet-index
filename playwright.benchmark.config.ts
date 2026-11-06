import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  outputDir: 'test-results/boot-benchmark',
  testIgnore: [],
  testMatch: 'boot-performance.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: 'playwright-report/boot-benchmark' },
    ],
  ],
});
