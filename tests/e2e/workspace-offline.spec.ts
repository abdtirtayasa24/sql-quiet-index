import { expect, test } from '@playwright/test';
import { typeSql } from '../fixtures/workspace-ui';
test('explicit proof download supports fresh offline workbench, draft and case-file export', async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await typeSql(
    page.getByRole('textbox', { name: 'PostgreSQL query' }),
    'SELECT count(*) FROM practice_records',
  );
  await page.getByRole('link', { name: 'Offline demo / updates' }).click();
  await expect(page.locator('#offline-status')).toContainText(
    'Shell installed',
    { timeout: 20000 },
  );
  await page
    .getByRole('button', { name: 'Download PG proof for offline', exact: true })
    .click();
  await expect(page.locator('#offline-status')).toContainText(
    'PG/parser proof available offline',
    { timeout: 60000 },
  );
  await page.close();
  await context.setOffline(true);
  const fresh = await context.newPage();
  await fresh.goto('/workspace.html');
  await expect(
    fresh.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await expect(
    fresh.getByRole('textbox', { name: 'PostgreSQL query' }),
  ).toContainText('SELECT count(*) FROM practice_records');
  await fresh.getByRole('button', { name: 'Run SQL', exact: true }).click();
  await fresh.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(fresh.getByRole('cell')).toHaveText('240');
  await fresh.getByRole('link', { name: 'Export / import case file' }).click();
  const download = fresh.waitForEvent('download');
  await fresh
    .getByRole('button', { name: 'Export saved case file', exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe('quiet-index-save.json');
});
