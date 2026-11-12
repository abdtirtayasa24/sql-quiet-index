import { expect, test } from '@playwright/test';
import { typeSql } from '../fixtures/workspace-ui';
test('CodeMirror shortcut/native fallback, immediate hidden flush and reload retain draft', async ({
  page,
}) => {
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  const editor = page.getByRole('textbox', { name: 'PostgreSQL query' });
  await typeSql(editor, 'SELECT count(*) FROM practice_records');
  await editor.press('Control+Enter');
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(
    page.getByRole('cell', { name: '240', exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Query', exact: true }).click();
  await page.getByRole('button', { name: 'Use native editor' }).click();
  await expect(editor).toHaveValue('SELECT count(*) FROM practice_records');
  await typeSql(
    editor,
    'SELECT record_id FROM practice_records ORDER BY record_id LIMIT 3',
  );
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('[data-save-status]')).toContainText('saved');
  await page.reload();
  await expect(editor).toContainText(
    'SELECT record_id FROM practice_records ORDER BY record_id LIMIT 3',
  );
  await expect(
    page.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await editor.press('Control+Enter');
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('1');
});
