import { expect, it } from 'vitest';
import { isBootResult, percentile } from '../../src/engine/boot-benchmark';

it('computes nearest-rank P75 without sorting or mutating the input', () => {
  const values = [40, 10, 30, 20];
  expect(percentile(values, 0.75)).toBe(30);
  expect(values).toEqual([40, 10, 30, 20]);
  expect(() => percentile([], 0.75)).toThrow();
  expect(() => percentile([NaN], 0.75)).toThrow();
  expect(() => percentile([1], NaN)).toThrow();
});
it('validates worker metrics rather than trusting structured-clone payloads', () => {
  const result = {
    strategy: 'initdb',
    release: 'test-a',
    pgVersion: 'PostgreSQL 18.6',
    rows: '5000',
    sum: '12502500',
    workerMs: 1200,
    engineWasmBytes: 134217728,
    resources: [],
  };
  expect(isBootResult(result)).toBe(true);
  for (const change of [
    { strategy: 'remote' },
    { release: undefined },
    { release: 'wrong/release' },
    { rows: '4999' },
    { workerMs: -1 },
    { workerMs: Infinity },
    { engineWasmBytes: 'unknown' },
    { resources: [{}] },
  ])
    expect(isBootResult({ ...result, ...change })).toBe(false);
});
