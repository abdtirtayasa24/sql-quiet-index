import validate from '../../generated/save/validator.mjs';
import { ImportFailure, MAX_FILE_BYTES } from '../types/case-file';
import type { CaseFile, CaseCollections } from '../types/case-file';
import { isObject } from '../types/save';
import { payloadHex } from './export-import';
import { campaignStores, schema } from './schema';

export function checkJsonTree(input: unknown) {
  const pending: { value: unknown; depth: number; key: string }[] = [
    { value: input, depth: 0, key: '' },
  ];
  let nodes = 0;
  while (pending.length) {
    const item = pending.pop();
    if (!item) break;
    const { value, depth, key } = item;
    if (++nodes > 200_000 || depth > 32) throw new ImportFailure('complexity');
    if (
      typeof value === 'number' &&
      (!Number.isFinite(value) ||
        (Number.isInteger(value) && !Number.isSafeInteger(value)))
    )
      throw new ImportFailure('schema');
    if (typeof value === 'string') {
      if (value.length > (key === 'text' ? 8000 : 12000))
        throw new ImportFailure('schema');
      if (
        [
          'createdAt',
          'updatedAt',
          'exportedAt',
          'filedAt',
          'firstSolvedAt',
          'lastRunAt',
          'timestamp',
        ].includes(key) &&
        (!Number.isFinite(Date.parse(value)) ||
          new Date(value).toISOString() !== value)
      )
        throw new ImportFailure('schema');
    }
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value) && value.length > 10000)
        throw new ImportFailure('schema');
      if (
        !Array.isArray(value) &&
        (!isObject(value) ||
          (Object.getPrototypeOf(value) !== Object.prototype &&
            Object.getPrototypeOf(value) !== null))
      )
        throw new ImportFailure('schema');
      const entries = Object.entries(value);
      if (!Array.isArray(value) && entries.length > 64)
        throw new ImportFailure('schema');
      for (const [childKey, child] of entries) {
        if (['__proto__', 'constructor', 'prototype'].includes(childKey))
          throw new ImportFailure('pollution');
        if (childKey.length > 128) throw new ImportFailure('schema');
        if (
          childKey === 'saveVersion' &&
          typeof child === 'number' &&
          child > 1
        )
          throw new ImportFailure('future');
        pending.push({ value: child, depth: depth + 1, key: childKey });
      }
    } else if (
      value !== null &&
      !['string', 'number', 'boolean'].includes(typeof value)
    )
      throw new ImportFailure('schema');
  }
}
export function checkCollections(data: CaseCollections) {
  const campaigns = new Set(
    data.campaigns.map((campaign) => campaign.campaignId),
  );
  const checkRefs = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) checkRefs(item);
    } else if (isObject(value))
      for (const [key, child] of Object.entries(value)) {
        if (
          (key === 'campaignId' || key.endsWith('CampaignId')) &&
          child !== null &&
          (typeof child !== 'string' || !campaigns.has(child))
        )
          throw new ImportFailure('references');
        checkRefs(child);
      }
  };
  for (const name of campaignStores) {
    const keys = new Set<string>();
    const keyPath = schema[name].keyPath;
    for (const row of data[name]) {
      const record = row as unknown as Record<string, unknown>;
      const key = JSON.stringify(
        (typeof keyPath === 'string' ? [keyPath] : keyPath).map(
          (part) => record[part],
        ),
      );
      if (keys.has(key)) throw new ImportFailure('references');
      keys.add(key);
      checkRefs(row);
    }
  }
}
// Synchronous structural checks are also used on the latest data inside IDB transactions.
export function checkCaseFile(value: unknown): asserts value is CaseFile {
  checkJsonTree(value);
  if (!validate(value)) throw new ImportFailure('schema');
  checkCollections(value as CaseFile);
}
export async function validateCaseFile(text: string): Promise<CaseFile> {
  if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES)
    throw new ImportFailure('size');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ImportFailure('json');
  }
  checkCaseFile(value);
  if ((await payloadHex(value)) !== value.integrity.payloadHex)
    throw new ImportFailure('integrity');
  return value;
}
