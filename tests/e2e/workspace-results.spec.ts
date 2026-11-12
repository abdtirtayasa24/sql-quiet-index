import { expect, test } from '@playwright/test';
import { typeSql } from '../fixtures/workspace-ui';
test('real PG results preserve columns/NULL, show bounded preview, feedback and free hints', async ({
  page,
}) => {
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  const run = page.getByRole('button', { name: 'Run SQL', exact: true });
  await expect(run).toBeEnabled({ timeout: 60000 });
  const editor = page.getByRole('textbox', { name: 'PostgreSQL query' });
  await typeSql(
    editor,
    "SELECT 1 AS id, NULL AS id, '<img src=x onerror=alert(1)>' AS text",
  );
  await run.click();
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(
    page.getByRole('columnheader', { name: /^id OID (23|25)$/ }),
  ).toHaveCount(2);
  await expect(
    page.getByRole('cell', { name: 'NULL', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('cell', {
      name: '<img src=x onerror=alert(1)>',
      exact: true,
    }),
  ).toBeVisible();
  expect(await page.locator('tqi-results img').count()).toBe(0);
  await typeSql(editor, 'SELECT * FROM practice_records ORDER BY record_id');
  await run.click();
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(
    page.getByText('200 of 240 rows shown.', { exact: true }),
  ).toBeVisible();
  await typeSql(editor, 'SELECT label, count(*) FROM practice_records');
  await run.click();
  await expect(page.locator('tqi-status')).toContainText('GROUP BY');
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'What happened?', exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
  for (let rung = 1; rung <= 4; rung++) {
    const hint = page.getByRole('button', { name: `Show hint ${rung}` });
    await hint.focus();
    await hint.press('Enter');
  }
  await expect(page.locator('tqi-hints')).toContainText('SELECT record_id');
  const reuse = page.getByRole('button', { name: 'Reuse query 2' });
  await reuse.focus();
  await reuse.press('Enter');
  await expect(editor).toContainText(
    'SELECT * FROM practice_records ORDER BY record_id',
  );
});
