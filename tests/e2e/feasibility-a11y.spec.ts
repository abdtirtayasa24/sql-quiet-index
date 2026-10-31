import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light'] as const) {
  for (const native of [false, true]) {
    test(`${theme} ${native ? 'native' : 'CodeMirror'} input is labeled, keyboard usable and AA-clean under CSP`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 360, height: 800 });
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/feasibility.html');
      const input = page.getByRole('textbox', {
        name: 'PostgreSQL query',
        exact: true,
      });
      await expect(input).toBeVisible();
      if (native)
        await page.getByRole('button', { name: 'Use native editor' }).click();
      await input.focus();
      await expect(input).toBeFocused();
      await input.press('Tab');
      await expect(
        page.getByRole('button', { name: 'Inspect SQL', exact: true }),
      ).toBeFocused();
      const box = await input.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(160);
      expect(
        await input.evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(16);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
