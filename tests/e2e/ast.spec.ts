import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { isEngineResponse } from '../../src/engine/protocol';

test('parses PG18 AST and cursor errors in the built worker under CSP @smoke', async ({
  page,
}, testInfo) => {
  const workerFile = readdirSync('dist/assets').find((file) =>
    /^postgres\.worker-.*\.js$/.test(file),
  );
  expect(workerFile).toBeDefined();
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') violations.push(message.text());
  });
  const navigation = await page.goto('/feasibility.html');
  expect(navigation?.headers()['content-security-policy']).toContain(
    "style-src 'self'",
  );
  const replies: unknown[] = await page.evaluate(
    async (url) => {
      const worker = new Worker(url, { type: 'module' });
      const queries = [
        'SELECT s.id, count(g.id) FROM staff s LEFT JOIN gates g ON s.id=g.id GROUP BY s.id',
        'WITH gone AS (DELETE FROM staff RETURNING *) SELECT * FROM gone',
        'SELECT FROM',
        'SELECT 1; SELECT 2',
      ];
      const results: unknown[] = [];
      try {
        for (const [index, sql] of queries.entries()) {
          results.push(
            await new Promise<unknown>((resolve, reject) => {
              const timer = setTimeout(
                () => reject(new Error('Parser reply timed out')),
                10_000,
              );
              worker.onmessage = (event: MessageEvent<unknown>) => {
                clearTimeout(timer);
                resolve(event.data);
              };
              worker.onerror = () => {
                clearTimeout(timer);
                reject(new Error('Parser worker failed'));
              };
              worker.postMessage({
                type: 'PARSE',
                sql,
                sessionId: 'ast-browser',
                requestId: index + 1,
              });
            }),
          );
        }
        return results;
      } finally {
        worker.terminate();
      }
    },
    `/assets/${workerFile ?? ''}`,
  );
  expect(replies.every(isEngineResponse)).toBe(true);
  expect(replies[0]).toMatchObject({
    type: 'PARSE_RESULT',
    result: {
      ok: true,
      version: 180004,
      observations: expect.arrayContaining([
        {
          kind: 'JOIN_LEFT',
          path: '$.stmts[0].stmt.SelectStmt.fromClause[0].JoinExpr.jointype',
        },
        {
          kind: 'FuncCall:count',
          path: '$.stmts[0].stmt.SelectStmt.targetList[1].ResTarget.val.FuncCall',
        },
      ]),
    },
  });
  expect(replies[1]).toMatchObject({
    type: 'PARSE_RESULT',
    result: {
      ok: true,
      observations: expect.arrayContaining([
        expect.objectContaining({ kind: 'DeleteStmt' }),
      ]),
    },
  });
  expect(replies[2]).toMatchObject({
    type: 'PARSE_RESULT',
    result: { ok: false, cursorPosition: 11 },
  });
  expect(replies[3]).toMatchObject({
    type: 'PARSE_RESULT',
    result: { ok: true, statements: ['SelectStmt', 'SelectStmt'] },
  });
  expect(violations).toEqual([]);
  await testInfo.attach('actual-ast-observations', {
    body: JSON.stringify(replies, null, 2),
    contentType: 'application/json',
  });
});
