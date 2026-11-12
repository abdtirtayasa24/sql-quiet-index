import { expect, it } from 'vitest';
import { practicePolicy } from '../../src/engine/workspace-policy';

it.each([
  'SELECT * FROM practice_records ORDER BY record_id',
  'SELECT count(*), sum(amount) FROM practice_records',
  'SELECT label, count(*) FROM practice_records GROUP BY label HAVING count(*) > 1',
  'SELECT a.record_id FROM practice_records a LEFT JOIN practice_records b ON a.record_id=b.record_id WHERE b.label IS NULL',
  "SELECT 9007199254740993::bigint, 1.234567890123456789::numeric, NULL, DATE '2028-11-04'",
])('allows the documented read-only practice subset: %s', async (sql) => {
  expect(await practicePolicy(sql)).toEqual({ ok: true });
});
it.each([
  'DELETE FROM practice_records',
  'SELECT 1; SELECT 2',
  'WITH gone AS (DELETE FROM practice_records RETURNING *) SELECT * FROM gone',
  'SELECT (SELECT pg_sleep(5))',
  "SELECT set_config('search_path','public',false)",
  'SELECT * FROM pg_catalog.pg_class',
  'SELECT * FROM information_schema.tables',
  'SELECT * FROM generate_series(1,1000000000)',
  'SELECT * INTO copy FROM practice_records',
  'SELECT * FROM practice_records FOR UPDATE',
  "SELECT 'x'::regclass",
  'SELECT 1 OPERATOR(pg_catalog.+) 2',
  'WITH RECURSIVE x AS (SELECT 1 UNION ALL SELECT * FROM x) SELECT * FROM x',
])('fails closed before execution: %s', async (sql) => {
  expect((await practicePolicy(sql)).ok).toBe(false);
});
it('bounds input and provides syntax feedback without throwing', async () => {
  expect(await practicePolicy('x'.repeat(12001))).toMatchObject({
    ok: false,
    code: 'LIMIT',
  });
  expect(await practicePolicy('SELECT FROM')).toMatchObject({
    ok: false,
    code: '42601',
  });
});
