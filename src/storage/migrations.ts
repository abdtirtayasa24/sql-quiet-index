import { isObject, StorageFailure } from '../types/save';
import type { Collections } from '../types/save';
import { schema } from './schema';
export type MigrationSteps = Readonly<
  Record<number, (copy: Collections) => Collections>
>;
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v: unknown, i) => same(v, b[i]));
  if (isObject(a) && isObject(b))
    return (
      Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every((key) => same(a[key], b[key]))
    );
  return false;
}
function identity(store: string, row: unknown): string {
  if (!isObject(row)) throw new StorageFailure('corrupt');
  const definition = Object.entries(schema).find(
    ([name]) => name === store,
  )?.[1];
  if (!definition) throw new StorageFailure('corrupt');
  const keys =
    typeof definition.keyPath === 'string'
      ? [definition.keyPath]
      : definition.keyPath;
  if (keys.some((key) => typeof row[key] !== 'string'))
    throw new StorageFailure('corrupt');
  return JSON.stringify(keys.map((key) => row[key]));
}
export function migrateCollections(
  input: Collections,
  from: number,
  to: number,
  steps: MigrationSteps,
): Collections {
  if (from > to) throw new StorageFailure('future');
  if (!Number.isSafeInteger(from) || from < 1 || !Number.isSafeInteger(to))
    throw new StorageFailure('corrupt');
  for (const rows of Object.values(input))
    for (const row of rows) {
      if (
        isObject(row) &&
        typeof row.saveVersion === 'number' &&
        row.saveVersion > from
      )
        throw new StorageFailure('future');
      if (!isObject(row) || row.saveVersion !== from)
        throw new StorageFailure('corrupt');
    }
  let current = structuredClone(input);
  for (let version = from; version < to; version++) {
    const step = steps[version];
    if (!step) throw new StorageFailure('corrupt');
    const next = step(structuredClone(current));
    for (const [store, rows] of Object.entries(current)) {
      for (const before of rows) {
        if (!isObject(before)) throw new StorageFailure('corrupt');
        const id = identity(store, before);
        const after = next[store]?.find((row) => identity(store, row) === id);
        if (!isObject(after)) throw new StorageFailure('corrupt');
        for (const [key, value] of Object.entries(before)) {
          if (key === 'saveVersion' || key === 'contentVersion') continue;
          if (
            store === 'campaigns' &&
            key === 'completedMissionIds' &&
            Array.isArray(value) &&
            Array.isArray(after[key]) &&
            value.every((id: unknown) => (after[key] as unknown[]).includes(id))
          )
            continue;
          if (
            store === 'evidence' &&
            key === 'status' &&
            after[key] === 'archived_legacy'
          )
            continue;
          if (!same(value, after[key])) throw new StorageFailure('corrupt');
        }
      }
    }
    for (const [store, rows] of Object.entries(next)) {
      const ids = rows.map((row) => identity(store, row));
      if (new Set(ids).size !== ids.length) throw new StorageFailure('corrupt');
    }
    for (const rows of Object.values(next))
      for (const row of rows) {
        if (!isObject(row)) throw new StorageFailure('corrupt');
        row.saveVersion = version + 1;
      }
    current = next;
  }
  return current;
}
export function archiveLegacy(
  input: Collections,
  currentRowKeys: ReadonlySet<string>,
): Collections {
  const copy = structuredClone(input);
  copy.evidence = (copy.evidence ?? []).map((row) =>
    isObject(row) &&
    Array.isArray(row.rowKeys) &&
    row.rowKeys.some(
      (key: unknown) => typeof key !== 'string' || !currentRowKeys.has(key),
    )
      ? { ...row, status: 'archived_legacy' }
      : row,
  );
  return copy;
}
