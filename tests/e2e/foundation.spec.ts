import { expect, test } from '@playwright/test';

test('@smoke renders the built Lit shell without runtime errors or external requests', async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith(`${baseURL}/`))
      externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(
    page.getByRole('heading', { level: 1, name: 'The Quiet Index' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'Foundation ready. SQL execution and saving are not available in this build.',
  );
  await expect(page.locator('tqi-app')).toHaveAttribute('data-ready', 'true');
  await page.getByText('About this build', { exact: true }).click();
  await expect(
    page.getByText('No case data is stored by this foundation.'),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('keeps a readable fallback with JavaScript disabled', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await expect(
    page.getByRole('heading', { name: 'The Quiet Index', level: 1 }),
  ).toBeVisible();
  // Playwright's text selector excludes noscript even when scripting is disabled.
  const notice = page.locator('noscript p');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveText(
    'JavaScript is disabled. You can read this introduction, but the planned game needs JavaScript.',
  );
  await context.close();
});

test('preserves reading and names a missing runtime feature', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Worker', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'This browser cannot run the planned game',
    }),
  ).toBeVisible();
  await expect(page.getByText('Web Workers', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The Quiet Index', level: 1 }),
  ).toBeVisible();
});

test('retains a readable notice if the Lit module download fails', async ({
  page,
}) => {
  await page.route('**/assets/app-*.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toHaveText(
    'The interface could not load. Check your connection and reload. This introduction is still available.',
  );
  await expect(
    page.getByRole('heading', { name: 'The Quiet Index', level: 1 }),
  ).toBeVisible();
});

test('supports keyboard navigation, visible focus and native disclosure', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('tqi-app')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.keyboard.press('Tab');
  const summary = page.getByText('About this build', { exact: true });
  await expect(summary).toBeFocused();
  expect(
    await summary.evaluate((node) => getComputedStyle(node).outlineStyle),
  ).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('No case data is stored by this foundation.'),
  ).toBeVisible();
});

for (const width of [320, 360, 768, 1280]) {
  test(`reflows without page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('tqi-app')).toHaveAttribute('data-ready', 'true');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole('heading', { name: 'The Quiet Index', level: 1 }),
    ).toBeInViewport();
  });
}

test('honors reduced motion and validates actual token contrast in both themes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('tqi-app')).toHaveAttribute('data-ready', 'true');
  for (const colorScheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme });
    const ratios = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context)
        throw new Error('Canvas required for actual color resolution');
      const luminance = (token: string) => {
        context.fillStyle = style.getPropertyValue(token).trim();
        context.fillRect(0, 0, 1, 1);
        const channels = Array.from(context.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((value) => {
            const s = value / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return (
          (channels[0] ?? 0) * 0.2126 +
          (channels[1] ?? 0) * 0.7152 +
          (channels[2] ?? 0) * 0.0722
        );
      };
      return ['--color-bg', '--color-surface'].flatMap((background) =>
        [
          '--color-text',
          '--color-muted',
          '--color-accent',
          '--color-warning',
          '--color-danger',
          '--color-focus',
        ].map((foreground) => {
          const a = luminance(background);
          const b = luminance(foreground);
          return {
            background,
            foreground,
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          };
        }),
      );
    });
    for (const pair of ratios)
      expect(
        pair.ratio,
        `${colorScheme}: ${pair.foreground}/${pair.background}`,
      ).toBeGreaterThanOrEqual(4.5);
  }
  expect(
    await page
      .locator('summary')
      .evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe('0s');
});
