import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['dark', 'light'] as const) {
  test(`technical desk keyboard, reflow and both editor modes: ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/technical.html');
    await expect(page.locator('#offline-status')).toContainText(
      'Shell installed',
      { timeout: 20_000 },
    );
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to technical proof' }),
    ).toBeFocused();
    for (const width of [320, 360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    for (const mode of ['rich', 'native']) {
      if (mode === 'native')
        await page
          .getByRole('button', { name: 'Use native editor', exact: true })
          .click();
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  });
}
