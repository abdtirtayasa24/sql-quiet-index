import { isRecord } from './protocol';

export type BootStrategy = 'initdb' | 'snapshot';
export interface BootResource {
  url: string;
  transferBytes: number;
  encodedBytes: number;
  decodedBytes: number;
}
export interface BootResult {
  release: string;
  strategy: BootStrategy;
  pgVersion: string;
  rows: string;
  sum: string;
  workerMs: number;
  engineWasmBytes: number;
  resources: BootResource[];
}
const nonnegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
export function isBootResult(value: unknown): value is BootResult {
  return (
    isRecord(value) &&
    typeof value.release === 'string' &&
    /^[A-Za-z0-9-]{1,80}$/.test(value.release) &&
    (value.strategy === 'initdb' || value.strategy === 'snapshot') &&
    typeof value.pgVersion === 'string' &&
    value.pgVersion.startsWith('PostgreSQL 18.') &&
    value.rows === '5000' &&
    value.sum === '12502500' &&
    nonnegative(value.workerMs) &&
    nonnegative(value.engineWasmBytes) &&
    Array.isArray(value.resources) &&
    value.resources.length <= 32 &&
    value.resources.every(
      (entry: unknown) =>
        isRecord(entry) &&
        typeof entry.url === 'string' &&
        nonnegative(entry.transferBytes) &&
        nonnegative(entry.encodedBytes) &&
        nonnegative(entry.decodedBytes),
    )
  );
}
export function percentile(
  values: readonly number[],
  quantile: number,
): number {
  if (
    !Number.isFinite(quantile) ||
    !values.length ||
    !values.every(nonnegative) ||
    quantile <= 0 ||
    quantile > 1
  )
    throw new Error('Invalid percentile sample.');
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * quantile) - 1]!;
}
