import { readFile } from 'node:fs/promises';
import type { PGlite } from '@electric-sql/pglite';
import { generateDataset } from '../../src/content/dataset';

export async function loadBaseData(
  pg: PGlite,
  seed: string,
  missionId = '017',
  variant = 0,
) {
  const data = generateDataset({
    contentVersion: '2026.10.1',
    campaignSeed: seed,
    caseId: `act${String(Math.ceil(Number(missionId) / 8)).padStart(2, '0')}`,
    missionId,
    variant,
  });
  await pg.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pg.exec(await readFile('content/datasets/base.sql', 'utf8'));
  await pg.transaction(async (tx) => {
    for (const insert of data.inserts)
      await tx.query(insert.sql, insert.params);
  });
  return data;
}
