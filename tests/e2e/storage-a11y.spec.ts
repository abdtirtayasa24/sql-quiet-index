import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['dark', 'light'] as const) {
  test(`storage desk keyboard, empty/ready states and reflow: ${colorScheme}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/storage.html');
    await expect(
      page.getByRole('button', { name: 'Create local case file' }),
    ).toBeEnabled();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to storage desk' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    for (const state of ['empty', 'ready']) {
      if (state === 'ready') {
        await page
          .getByRole('button', { name: 'Create local case file' })
          .focus();
        await page.keyboard.press('Enter');
        await expect(page.getByLabel('SQL draft')).toBeFocused();
        await page
          .getByLabel('SQL draft')
          .fill('<script>not executed</script>');
        await expect(page.locator('[data-save-status]')).toContainText(
          'Draft saved locally',
        );
      }
      for (const width of [320, 360, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
    expect(errors).toEqual([]);
    expect(requests.some((url) => /\.(wasm|data)(\?|$)/.test(url))).toBe(false);
  });
}
