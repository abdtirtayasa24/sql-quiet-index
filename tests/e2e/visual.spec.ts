import { expect, test } from '@playwright/test';

for (const colorScheme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`${colorScheme} foundation at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/');
      await expect(page.locator('tqi-app')).toHaveAttribute(
        'data-ready',
        'true',
      );
      await expect(page).toHaveScreenshot(
        `foundation-${colorScheme}-${width}.png`,
        {
          fullPage: true,
          animations: 'disabled',
        },
      );
    });
  }
}
