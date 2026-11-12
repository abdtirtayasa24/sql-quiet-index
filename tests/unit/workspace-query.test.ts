import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { loadPractice, runPractice } from '../../src/engine/workspace-data';
let pg: PGlite;
beforeAll(async () => {
  pg = await PGlite.create({ dataDir: 'memory://' });
  await loadPractice(pg, '1234abcd');
}, 60000);
afterAll(async () => {
  await pg?.close();
});
it('preserves duplicate fields, exact numeric/bigint/date and NULL as row arrays', async () => {
  const reply = await runPractice(
    pg,
    "SELECT 9007199254740993::bigint AS id, 1.234567890123456789::numeric AS id, NULL AS absent, DATE '2028-11-04' AS day",
  );
  expect(reply).toMatchObject({
    ok: true,
    result: {
      rowCount: 1,
      rows: [['9007199254740993', '1.234567890123456789', null, '2028-11-04']],
    },
  });
  if (reply.ok)
    expect(reply.result.fields.map((f) => f.name)).toEqual([
      'id',
      'id',
      'absent',
      'day',
    ]);
});
it('compares full count before returning a 200-row preview; reset is deterministic', async () => {
  const a = await runPractice(
    pg,
    'SELECT * FROM practice_records ORDER BY record_id',
  );
  expect(a).toMatchObject({ ok: true, result: { rowCount: 240 } });
  if (a.ok) expect(a.result.rows).toHaveLength(200);
  await loadPractice(pg, '1234abcd');
  expect(
    await runPractice(pg, 'SELECT * FROM practice_records ORDER BY record_id'),
  ).toEqual(a);
});
it('denies mutation/nested side effects and cleans up after real SQLSTATE errors', async () => {
  expect(await runPractice(pg, 'DELETE FROM practice_records')).toMatchObject({
    ok: false,
    code: 'POLICY',
  });
  expect(
    await runPractice(pg, 'SELECT unknown FROM practice_records'),
  ).toMatchObject({ ok: false, code: '42703' });
  expect(
    await runPractice(pg, 'SELECT label, count(*) FROM practice_records'),
  ).toMatchObject({ ok: false, code: '42803' });
  expect(await runPractice(pg, 'SELECT 1 / 0')).toMatchObject({
    ok: false,
    code: '22012',
  });
  expect(
    await runPractice(pg, 'SELECT count(*) FROM practice_records'),
  ).toMatchObject({ ok: true, result: { rows: [['240']] } });
});
it('bounds full results/columns/cells without silently claiming correctness', async () => {
  expect(
    await runPractice(
      pg,
      'SELECT a.record_id FROM practice_records a JOIN practice_records b ON true',
    ),
  ).toMatchObject({ ok: false, code: 'LIMIT' });
  expect(
    await runPractice(
      pg,
      `SELECT ${Array.from({ length: 13 }, () => '1').join(',')}`,
    ),
  ).toMatchObject({ ok: false, code: 'LIMIT' });
  expect(await runPractice(pg, `SELECT '${'x'.repeat(4097)}'`)).toMatchObject({
    ok: false,
    code: 'LIMIT',
  });
});
