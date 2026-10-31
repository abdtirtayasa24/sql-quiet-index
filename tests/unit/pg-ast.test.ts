import { describe, expect, it } from 'vitest';
import { parseSql } from '../../src/engine/pg-ast';

const fixtures = [
  ['SELECT 1', ['SelectStmt']],
  [
    'SELECT s.id, count(g.id) FROM staff s LEFT JOIN gates g ON s.id=g.id GROUP BY s.id',
    [
      'SelectStmt',
      'JoinExpr',
      'JOIN_LEFT',
      'FuncCall:count',
      'groupClause',
      'ColumnRef',
    ],
  ],
  ['SELECT * FROM (SELECT 1 n) t', ['RangeSubselect', 'SelectStmt']],
  [
    'WITH RECURSIVE t(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM t WHERE n<3) SELECT * FROM t',
    ['recursive', 'CommonTableExpr', 'SelectStmt'],
  ],
  [
    'WITH t AS (WITH u AS (SELECT 1) SELECT * FROM u) SELECT * FROM t',
    ['CommonTableExpr', 'withClause'],
  ],
  [
    'WITH gone AS (DELETE FROM staff RETURNING *) SELECT * FROM gone',
    ['SelectStmt', 'DeleteStmt'],
  ],
  ['SELECT 1; SELECT 2;', ['SelectStmt']],
] as const;

describe('the actual pinned PostgreSQL 18 AST', () => {
  it.each(fixtures)('observes node kinds for %s', async (sql, kinds) => {
    const result = await parseSql(sql);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.version).toBe(180004);
    for (const kind of kinds)
      expect(result.observations.map((node) => node.kind)).toContain(kind);
  });
  it('retains statement count and does not mistake a modifying CTE for read-only safety', async () => {
    expect(await parseSql('SELECT 1; DELETE FROM staff')).toMatchObject({
      ok: true,
      statements: ['SelectStmt', 'DeleteStmt'],
    });
    const cte = await parseSql(
      'WITH gone AS (DELETE FROM staff RETURNING *) SELECT * FROM gone',
    );
    expect(cte.ok).toBe(true);
    if (!cte.ok) throw new Error(cte.message);
    expect(cte.statements).toEqual(['SelectStmt']);
    expect(cte.observations).toContainEqual({
      kind: 'DeleteStmt',
      path: '$.stmts[0].stmt.SelectStmt.withClause.ctes[0].CommonTableExpr.ctequery.DeleteStmt',
    });
  });
  it('reports actual grouped-column paths and function names', async () => {
    const result = await parseSql('SELECT count(id) FROM staff GROUP BY id');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.observations).toContainEqual({
      kind: 'FuncCall:count',
      path: '$.stmts[0].stmt.SelectStmt.targetList[0].ResTarget.val.FuncCall',
    });
    expect(result.observations).toContainEqual({
      kind: 'ColumnRef',
      path: '$.stmts[0].stmt.SelectStmt.groupClause[0].ColumnRef',
    });
  });
  it('returns typed syntax errors with the upstream cursor position', async () => {
    const result = await parseSql('SELECT FROM');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected syntax error');
    expect(result.message).toContain('syntax error');
    expect(result.cursorPosition).toBe(11);
  });
  it('allows an empty parse result without claiming a single statement', async () => {
    expect(await parseSql('-- no query')).toMatchObject({
      ok: true,
      statements: [],
    });
  });
  it('rejects oversized input before invoking the parser', async () => {
    expect(await parseSql('x'.repeat(12_001))).toEqual({
      ok: false,
      message: 'SQL exceeds 12,000 characters.',
    });
  });
});
