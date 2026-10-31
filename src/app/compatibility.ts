export interface RuntimeCapabilities {
  readonly secureContext: boolean;
  readonly worker: boolean;
  readonly webAssembly: boolean;
  readonly indexedDB: boolean;
  readonly cacheStorage: boolean;
}

export function missingCapabilities(
  features: RuntimeCapabilities,
): readonly string[] {
  const requirements: readonly [keyof RuntimeCapabilities, string][] = [
    ['secureContext', 'a secure connection (HTTPS or localhost)'],
    ['worker', 'Web Workers'],
    ['webAssembly', 'WebAssembly'],
    ['indexedDB', 'IndexedDB storage'],
    ['cacheStorage', 'the Cache API'],
  ];
  return requirements
    .filter(([key]) => !features[key])
    .map(([, label]) => label);
}
