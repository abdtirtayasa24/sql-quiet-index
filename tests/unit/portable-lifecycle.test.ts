import { expect, it } from 'vitest';
import { PortableController } from '../../src/app/portable-controller';
import { StorageFailure } from '../../src/types/save';
import { caseCollections } from '../fixtures/save-file';
it('a failed open is handled once, including later disposal, not an unhandled rejection', async () => {
  const app = new PortableController(
    () => {},
    () => Promise.reject(new StorageFailure('unavailable')),
  );
  await expect(app.recoveryLocal()).rejects.toThrow('unavailable');
  app.dispose();
  await new Promise((resolve) => setTimeout(resolve, 0));
});
it('suspension closes and reopens only the connection, retaining unsupported original bytes', async () => {
  let opens = 0,
    closes = 0;
  const app = new PortableController(
    () => {},
    () => {
      opens++;
      return Promise.resolve({
        futureSchema: false,
        snapshot: () => Promise.resolve(caseCollections()),
        importCaseFile: () => Promise.reject(new Error('not requested')),
        close: () => {
          closes++;
        },
      });
    },
  );
  const original = ' {"saveVersion":99}';
  await app.select(new Blob([original]));
  await app.recoveryLocal();
  app.suspend();
  await app.recoveryLocal();
  expect(opens).toBe(2);
  expect(closes).toBe(1);
  expect(app.view.kind).toBe('unsupported');
  expect(await app.original()?.text()).toBe(original);
  app.dispose();
});
