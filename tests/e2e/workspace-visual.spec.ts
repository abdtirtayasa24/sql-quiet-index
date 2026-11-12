import { expect, test } from '@playwright/test';
for (const colorScheme of ['dark', 'light'] as const)
  for (const width of [360, 1280]) {
    test(`workspace ${colorScheme} ${width}px`, async ({ page }) => {
      test.setTimeout(90000);
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/workspace.html');
      await page
        .getByRole('button', { name: 'Create local practice file' })
        .click();
      await expect(
        page.getByRole('button', { name: 'Run SQL', exact: true }),
      ).toBeEnabled({ timeout: 60000 });
      await expect(
        page.getByRole('tablist', { name: 'Workspace' }),
      ).toBeVisible();
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      await expect(page).toHaveScreenshot(
        `workspace-${colorScheme}-${width}.png`,
        { fullPage: true, animations: 'disabled' },
      );
    });
  }
