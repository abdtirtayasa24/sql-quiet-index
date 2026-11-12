import { expect, test } from '@playwright/test';
import { typeSql } from '../fixtures/workspace-ui';

test('desktop panels isolate growing history without moving results or recreating the editor', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  const tabs = page.getByRole('tablist', { name: 'Workspace' });
  await expect(tabs).toBeVisible();
  await expect(tabs).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  const editor = page.getByRole('textbox', { name: 'PostgreSQL query' });
  const original = await editor.elementHandle();
  let firstTop = 0;
  for (let index = 0; index < 8; index++) {
    await page.getByRole('tab', { name: 'Query', exact: true }).click();
    await typeSql(editor, `SELECT ${index} AS run_marker`);
    await page.getByRole('button', { name: 'Run SQL', exact: true }).click();
    await expect(page.locator('tqi-status')).toContainText(
      `Run ${index + 1}: 1 rows returned`,
    );
    await page.getByRole('tab', { name: 'Results', exact: true }).click();
    await expect(
      page.getByRole('cell', { name: String(index), exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Recent queries', exact: true }),
    ).not.toBeVisible();
    const box = await page.getByRole('table').boundingBox();
    expect(box).not.toBeNull();
    if (index === 0) firstTop = box?.y ?? 0;
    expect(box?.y).toBe(firstTop);
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
  }
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Recent queries', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table')).not.toBeVisible();
  const reuse = page.getByRole('button', { name: 'Reuse query 2' });
  await reuse.focus();
  await reuse.press('Enter');
  await expect(
    page.getByRole('tab', { name: 'Query', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(editor).toBeFocused();
  await expect(editor).toContainText('SELECT 6 AS run_marker');
  expect(
    await editor.evaluate(
      (element, previous) => element === previous,
      original,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 360, height: 900 });
  await expect(tabs).toHaveAttribute('aria-orientation', 'vertical');
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(tabs).toHaveAttribute('aria-orientation', 'horizontal');
  const query = page.getByRole('tab', { name: 'Query', exact: true });
  await query.focus();
  await query.press('End');
  await expect(
    page.getByRole('tab', { name: 'Evidence', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Home');
  await expect(
    page.getByRole('tab', { name: 'Brief', exact: true }),
  ).toBeFocused();
});
test('workspace tabs retain editor and modal restores focus across Shadow DOM', async ({
  page,
}) => {
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await page.setViewportSize({ width: 360, height: 800 });
  const query = page.getByRole('tab', { name: 'Query', exact: true });
  await query.click();
  await query.press('ArrowDown');
  await expect(
    page.getByRole('tab', { name: 'Results', exact: true }),
  ).toBeFocused();
  await query.click();
  await page.getByRole('button', { name: 'Reset practice database' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reset practice database' }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
