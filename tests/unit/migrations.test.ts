import { expect, it } from 'vitest';
import {
  archiveLegacy,
  migrateCollections,
} from '../../src/storage/migrations';
import type { Collections } from '../../src/types/save';
const original = (): Collections => ({
  campaigns: [
    {
      campaignId: 'c',
      saveVersion: 1,
      seed: '12345678',
      completedMissionIds: ['001'],
    },
  ],
  notes: [
    { campaignId: 'c', noteId: 'n1', saveVersion: 1, text: 'Keep this note' },
  ],
  evidence: [
    {
      campaignId: 'c',
      evidenceId: 'e1',
      saveVersion: 1,
      queryText: 'SELECT 1',
      rowKeys: ['missing'],
      selectedRecordRefs: [{ table: 'staff', pk: '1' }],
    },
  ],
});
it('runs sequential steps on copies and preserves records and solved IDs', () => {
  const input = original();
  const result = migrateCollections(input, 1, 3, {
    1: (data) => ({ ...data, added: [] }),
    2: (data) => archiveLegacy(data, new Set()),
  });
  expect(input).toEqual(original());
  expect(result.campaigns).toMatchObject([
    { saveVersion: 3, completedMissionIds: ['001'] },
  ]);
  expect(result.notes).toMatchObject([{ text: 'Keep this note' }]);
  expect(result.evidence).toMatchObject([
    { status: 'archived_legacy', queryText: 'SELECT 1', rowKeys: ['missing'] },
  ]);
});
it('a crash cannot mutate the caller and absent/future versions are not downgraded', () => {
  const input = original();
  expect(() =>
    migrateCollections(input, 1, 2, {
      1: (copy) => {
        copy.notes = [];
        throw new Error('crash');
      },
    }),
  ).toThrow('crash');
  expect(input).toEqual(original());
  expect(() => migrateCollections(input, 3, 1, {})).toThrow('future');
  expect(() => migrateCollections(input, 1, 2, {})).toThrow('corrupt');
});
it('never downgrades a future-version child record hidden inside a v1 campaign', () => {
  const mixed = {
    ...original(),
    evidence: [{ campaignId: 'c', evidenceId: 'e1', saveVersion: 99 }],
  };
  expect(() => migrateCollections(mixed, 1, 2, { 1: (copy) => copy })).toThrow(
    'future',
  );
});
it('rejects duplicate output keys that could overwrite a preserved note later in the transaction', () => {
  expect(() =>
    migrateCollections(original(), 1, 2, {
      1: (data) => ({
        ...data,
        notes: [
          ...(data.notes ?? []),
          {
            campaignId: 'c',
            noteId: 'n1',
            saveVersion: 1,
            text: 'replacement',
          },
        ],
      }),
    }),
  ).toThrow('corrupt');
});
it('rejects a migration that removes notes, changes stable IDs, seed or revokes solved progress', () => {
  for (const change of [
    (data: Collections) => ({ ...data, notes: [] }),
    (data: Collections) => ({
      ...data,
      campaigns: [
        { campaignId: 'different', saveVersion: 1, completedMissionIds: [] },
      ],
    }),
  ])
    expect(() => migrateCollections(original(), 1, 2, { 1: change })).toThrow(
      'corrupt',
    );
});
