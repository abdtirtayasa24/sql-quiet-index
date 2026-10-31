import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['dark', 'light'] as const) {
  test(`foundation has no automated WCAG AA findings in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/');
    await expect(page.locator('tqi-app')).toHaveAttribute('data-ready', 'true');
    await page.getByText('About this build', { exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test(`compatibility notice has no automated AA findings in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.addInitScript(() =>
      Object.defineProperty(window, 'Worker', { value: undefined }),
    );
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        name: 'This browser cannot run the planned game',
      }),
    ).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
