import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { typeSql } from '../fixtures/workspace-ui';
for (const colorScheme of ['dark', 'light'] as const) {
  test(`workbench keyboard, reflow and automated AA states ${colorScheme}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/workspace.html');
    const audit = async () =>
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await audit();
    await page
      .getByRole('button', { name: 'Create local practice file' })
      .click();
    const run = page.getByRole('button', { name: 'Run SQL', exact: true });
    await expect(run).toBeEnabled({ timeout: 60000 });
    await audit();
    for (const name of ['Brief', 'Evidence', 'Query']) {
      await page.getByRole('tab', { name, exact: true }).click();
      await audit();
    }
    const editor = page.getByRole('textbox', { name: 'PostgreSQL query' });
    await typeSql(editor, 'SELECT 1 AS id, NULL AS id');
    await run.click();
    await page.getByRole('tab', { name: 'Results', exact: true }).click();
    await expect(
      page.getByRole('cell', { name: 'NULL', exact: true }),
    ).toBeVisible();
    await audit();
    await typeSql(editor, 'SELECT label, count(*) FROM practice_records');
    await run.click();
    await expect(page.locator('tqi-status')).toContainText('GROUP BY');
    await page.getByRole('tab', { name: 'Results', exact: true }).click();
    await audit();
    await page.getByRole('tab', { name: 'Query', exact: true }).click();
    await page.getByRole('button', { name: 'Reset practice database' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit();
    await page.keyboard.press('Escape');
    for (const width of [320, 360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.setViewportSize({ width: 360, height: 900 });
    await page.getByRole('tab', { name: 'Query', exact: true }).click();
    await page.getByRole('button', { name: 'Use native editor' }).click();
    await audit();
    for (const button of await page.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
}
