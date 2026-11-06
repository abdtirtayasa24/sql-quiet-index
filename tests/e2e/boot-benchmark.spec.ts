import { expect, test } from '@playwright/test';

test('inspection worker construction failure leaves a usable editor and truthful retry state', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      value: class {
        constructor() {
          throw new Error('Injected worker unavailable');
        }
      },
    });
  });
  await page.goto('/technical.html');
  await page.getByRole('button', { name: 'Inspect SQL', exact: true }).click();
  await expect(page.locator('#inspection-status')).toContainText(
    'Syntax inspection unavailable',
  );
  await expect(
    page.getByRole('textbox', { name: 'PostgreSQL query', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('compares fresh initdb and the coupled shared snapshot without blocking input @smoke', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/technical.html');
  await expect(
    page.getByRole('heading', { name: 'Technical proof desk' }),
  ).toBeVisible();
  const editor = page.getByRole('textbox', {
    name: 'PostgreSQL query',
    exact: true,
  });
  for (const strategy of ['fresh initdb', 'shared snapshot']) {
    await page
      .getByRole('button', { name: `Benchmark ${strategy}`, exact: true })
      .click();
    await editor.click();
    await page.keyboard.type('SELECT 1;');
    await expect(editor).toContainText('SELECT 1;');
    await expect(page.locator('#benchmark-status')).toContainText(
      'Trial complete',
      { timeout: 60_000 },
    );
  }
  await page.getByRole('button', { name: 'Inspect SQL', exact: true }).click();
  await expect(page.locator('#inspection-output')).toContainText('180004', {
    timeout: 30_000,
  });
  await expect(page.locator('#inspection-status')).toContainText(
    'Syntax inspected, not executed',
  );
  const output = page.locator('#benchmark-output');
  await expect(output).toContainText('12502500');
  await expect(output).toContainText('snapshot');
  await expect(output).toContainText('initdb');
  expect(errors).toEqual([]);
  await testInfo.attach('boot-trials-not-device-certification', {
    body: await output.innerText(),
    contentType: 'application/json',
  });
});
