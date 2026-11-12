import { expect, test } from '@playwright/test';
import { exportCaseFile } from '../../src/storage/export-import';
import { caseCollections } from '../fixtures/save-file';
for (const theme of ['dark', 'light'] as const)
  for (const width of [360, 1280]) {
    test(`portable ${theme} ${width}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/#/settings');
      await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
        name: 'review-case.json',
        mimeType: 'application/json',
        buffer: Buffer.from(await exportCaseFile(caseCollections())),
      });
      await expect(
        page.getByRole('heading', { name: 'Review before importing' }),
      ).toBeVisible();
      await page
        .getByRole('heading', { name: 'Settings / safe storage', exact: true })
        .focus();
      await expect(page).toHaveScreenshot(`portable-${theme}-${width}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
