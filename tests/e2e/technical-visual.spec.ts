import { expect, test } from '@playwright/test';

for (const colorScheme of ['dark', 'light'] as const)
  for (const width of [360, 1280]) {
    test(`technical ${colorScheme} ${width}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/technical.html');
      await expect(page.locator('#offline-status')).toContainText(
        'Shell installed',
        { timeout: 20_000 },
      );
      await expect(page).toHaveScreenshot(
        `technical-${colorScheme}-${width}.png`,
        { fullPage: true, mask: [page.locator('#proof-release')] },
      );
    });
  }
