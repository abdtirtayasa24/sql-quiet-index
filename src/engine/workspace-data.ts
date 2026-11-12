import type { PGlite } from '@electric-sql/pglite';
import { practicePolicy } from './workspace-policy';
import { isRecord } from './protocol';
import type { PracticeResult } from './workspace-protocol';
export async function loadPractice(pg: PGlite, seed: string): Promise<void> {
  if (!/^[a-f0-9]{8,16}$/.test(seed)) throw new Error('Invalid seed');
  await pg.exec(`SET TIME ZONE 'UTC'; DROP TABLE IF EXISTS practice_records;
    CREATE TABLE practice_records (record_id int PRIMARY KEY, label text, amount numeric(12,2), recorded_on date);`);
  const offset = Number.parseInt(seed.slice(0, 8), 16) % 100;
  await pg.query(
    `INSERT INTO practice_records SELECT n, CASE WHEN n % 7 = 0 THEN NULL ELSE 'Ledger ' || (n % 4) END, (n + $1)::numeric / 100, DATE '2028-11-04' + (n % 3) FROM generate_series(1,240) AS n`,
    [offset],
  );
  // Warm the parser during the separate boot deadline, not the query deadline.
  await practicePolicy('SELECT 1');
}
export async function runPractice(
  pg: PGlite,
  sql: string,
): Promise<{ ok: true; result: PracticeResult } | { ok: false; code: string }> {
  const policy = await practicePolicy(sql);
  if (!policy.ok) return policy;
  await pg.query('BEGIN READ ONLY');
  try {
    await pg.query("SET LOCAL statement_timeout = '2000ms'");
    await pg.query(`DECLARE tqi_preview NO SCROLL CURSOR FOR ${sql}`);
    const result = await pg.query<unknown[]>(
      'FETCH FORWARD 1001 FROM tqi_preview',
      [],
      {
        rowMode: 'array',
        parsers: {
          20: (text) => text,
          1700: (text) => text,
          1082: (text) => text,
          1184: (text) => text,
        },
      },
    );
    if (
      result.rows.length > 1000 ||
      result.fields.length > 12 ||
      result.fields.some((f) => f.name.length > 256)
    )
      return { ok: false, code: 'LIMIT' };
    const rows: (string | number | boolean | null)[][] = [];
    let bytes = 0;
    for (const row of result.rows) {
      const output: (string | number | boolean | null)[] = [];
      for (const value of row) {
        if (!(
          value === null ||
          typeof value === 'string' ||
          typeof value === 'boolean' ||
          (typeof value === 'number' &&
            Number.isFinite(value) &&
            (!Number.isInteger(value) || Number.isSafeInteger(value)))
        ))
          return { ok: false, code: 'LIMIT' };
        const text = String(value);
        bytes += text.length;
        if (text.length > 4096 || bytes > 262144)
          return { ok: false, code: 'LIMIT' };
        output.push(value);
      }
      if (rows.length < 200) rows.push(output);
    }
    return {
      ok: true,
      result: {
        fields: result.fields.map((f) => ({
          name: f.name,
          typeOid: f.dataTypeID,
        })),
        rows,
        rowCount: result.rows.length,
      },
    };
  } catch (error) {
    return {
      ok: false,
      code:
        isRecord(error) &&
        typeof error.code === 'string' &&
        /^[0-9A-Z]{5}$/.test(error.code)
          ? error.code
          : 'QUERY',
    };
  } finally {
    await pg.query('ROLLBACK');
  }
}
