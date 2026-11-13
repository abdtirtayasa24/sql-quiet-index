import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('serializes hosted browser workers without skipping engines, adding retries or extending deadlines', async () => {
  vi.stubEnv('CI', 'true');
  vi.resetModules();
  const { default: config } = await import('../../playwright.config');
  expect(config.workers).toBe(1);
  expect(config.retries).toBe(0);
  expect(config.projects?.map((project) => project.name)).toEqual([
    'chromium',
    'firefox',
    'webkit',
  ]);
  expect(config.timeout).toBeUndefined();
});

it('retains two local browser workers', async () => {
  vi.stubEnv('CI', undefined);
  vi.resetModules();
  const { default: config } = await import('../../playwright.config');
  expect(config.workers).toBe(2);
});
