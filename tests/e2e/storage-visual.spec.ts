import { expect, test } from '@playwright/test';
for (const colorScheme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`storage ${colorScheme} ${width}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/storage.html');
      await page
        .getByRole('button', { name: 'Create local case file' })
        .click();
      await page
        .getByLabel('SQL draft')
        .fill('SELECT 1; -- a local draft, not an executed query');
      await expect(page.locator('[data-save-status]')).toContainText(
        'Draft saved locally',
      );
      await expect(page).toHaveScreenshot(
        `storage-${colorScheme}-${width}.png`,
        { fullPage: true, mask: [page.locator('[data-variable]')] },
      );
    });
  }
}
