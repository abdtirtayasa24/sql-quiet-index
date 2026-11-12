import type { Collections } from '../types/save';
import { isObject } from '../types/save';
import { ImportFailure } from '../types/case-file';
import { campaignStores } from './schema';

export function canonicalJson(input: unknown): string {
  let nodes = 0;
  const encode = (value: unknown, depth: number): string => {
    if (++nodes > 200_000 || depth > 32) throw new Error('complexity');
    if (value === null) return 'null';
    if (typeof value === 'string' || typeof value === 'boolean')
      return JSON.stringify(value);
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      (!Number.isInteger(value) || Number.isSafeInteger(value))
    )
      return JSON.stringify(value);
    if (Array.isArray(value))
      return `[${Array.from(value, (item: unknown) => encode(item, depth + 1)).join(',')}]`;
    if (
      typeof value !== 'object' ||
      value === null ||
      (Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null)
    )
      throw new Error('non-json');
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${encode(record[key], depth + 1)}`)
      .join(',')}}`;
  };
  return encode(input, 0);
}
export async function payloadHex(
  input: Record<string, unknown>,
): Promise<string> {
  const payload = Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== 'integrity'),
  );
  const bytes = new TextEncoder().encode(canonicalJson(payload));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
export async function exportCaseFile(
  records: Collections,
  exportedAt = new Date().toISOString(),
): Promise<string> {
  const copy = structuredClone(records);
  if (
    campaignStores.some((name) =>
      copy[name]?.some(
        (row) =>
          isObject(row) &&
          typeof row.saveVersion === 'number' &&
          row.saveVersion > 1,
      ),
    )
  )
    throw new ImportFailure('future');
  const payload = {
    format: 'the-quiet-index-save',
    saveVersion: 1,
    exportedAt,
    appVersion: '0.0.0',
    ...Object.fromEntries(
      campaignStores.map((name) => [name, copy[name] ?? []]),
    ),
  };
  const integrity = {
    algorithm: 'SHA-256',
    payloadHex: await payloadHex(payload),
  };
  return canonicalJson({ ...payload, integrity });
}
