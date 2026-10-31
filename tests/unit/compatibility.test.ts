import { describe, expect, it } from 'vitest';
import {
  missingCapabilities,
  type RuntimeCapabilities,
} from '../../src/app/compatibility';

const supported: RuntimeCapabilities = {
  secureContext: true,
  worker: true,
  webAssembly: true,
  indexedDB: true,
  cacheStorage: true,
};

describe('planned-game compatibility notice', () => {
  it('does not show a warning when all required APIs are present', () => {
    expect(missingCapabilities(supported)).toEqual([]);
  });

  it.each([
    ['secureContext', 'a secure connection (HTTPS or localhost)'],
    ['worker', 'Web Workers'],
    ['webAssembly', 'WebAssembly'],
    ['indexedDB', 'IndexedDB storage'],
    ['cacheStorage', 'the Cache API'],
  ] as const)(
    'names the missing %s capability without claiming an engine boot test',
    (key, label) => {
      expect(missingCapabilities({ ...supported, [key]: false })).toEqual([
        label,
      ]);
    },
  );

  it('reports multiple missing features in a stable order without changing input', () => {
    const features = Object.freeze({
      ...supported,
      worker: false,
      indexedDB: false,
    });
    expect(missingCapabilities(features)).toEqual([
      'Web Workers',
      'IndexedDB storage',
    ]);
    expect(features.worker).toBe(false);
  });
});
