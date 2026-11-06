import { afterEach, expect, it, vi } from 'vitest';
import { ProofController } from '../../src/app/proof-controller';

afterEach(() => vi.unstubAllGlobals());
it('serializes initial setup/retry and leaves a truthful retry state after setup failure', async () => {
  let calls = 0;
  vi.stubGlobal('caches', {});
  vi.stubGlobal('navigator', {
    serviceWorker: {
      getRegistration: () => {
        calls++;
        return Promise.reject(new Error('unavailable'));
      },
    },
  });
  const controller = new ProofController(() => {});
  await Promise.all([controller.start(), controller.start()]);
  expect(calls).toBe(1);
  expect(controller.status).toContain('Offline setup unavailable');
  expect(controller.available).toBe(false);
  controller.dispose();
});
