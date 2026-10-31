import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`feasibility ${theme} ${width}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/feasibility.html');
      await expect(
        page.getByRole('textbox', { name: 'PostgreSQL query', exact: true }),
      ).toBeVisible();
      await expect(page).toHaveScreenshot(`feasibility-${theme}-${width}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
