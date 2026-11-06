import { expect, test } from '@playwright/test';

// Run serially against the loopback A/B static-artifact server, never production.
test.beforeEach(async ({ request }) => {
  expect((await request.put('/__test/release', { data: 'a' })).ok()).toBe(true);
});
test('declines unsafe reload, preserves another tab, and serves old immutable workers after explicit update', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(120_000);
  await page.goto('/technical.html');
  await expect(page.locator('#offline-status')).toContainText(
    'Shell installed',
  );
  await page.reload();
  const other = await context.newPage();
  await other.goto('/technical.html');
  const editor = other.getByRole('textbox', {
    name: 'PostgreSQL query',
    exact: true,
  });
  await editor.click();
  await other.keyboard.type('-- keep this tab');
  let otherReloads = 0;
  other.on('framenavigated', (frame) => {
    if (frame === other.mainFrame()) otherReloads++;
  });
  expect((await request.put('/__test/release', { data: 'b' })).ok()).toBe(true);
  await page
    .getByRole('button', { name: 'Check for update', exact: true })
    .click();
  await expect(page.locator('#update-status')).toHaveText('Update available', {
    timeout: 20_000,
  });
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(page.locator('#update-status')).toHaveText('Update deferred');
  await page.getByRole('button', { name: 'Apply update', exact: true }).click();
  await expect(page.locator('#update-status')).toHaveText('Update blocked');
  await expect(page.locator('#proof-release')).toContainText('test-a');
  await page.getByRole('checkbox', { name: 'I copied any draft' }).check();
  await page.getByRole('button', { name: 'Apply update', exact: true }).click();
  await expect(page.locator('#proof-release')).toHaveText('Release test-b', {
    timeout: 20_000,
  });
  await expect(other.locator('#proof-release')).toHaveText('Release test-a');
  await expect(editor).toContainText('-- keep this tab');
  expect(otherReloads).toBe(0);
  for (const [tab, release] of [
    [other, 'test-a'],
    [page, 'test-b'],
  ] as const) {
    await tab
      .getByRole('button', { name: 'Benchmark fresh initdb', exact: true })
      .click();
    await expect(tab.locator('#benchmark-status')).toContainText(
      'Trial complete',
      { timeout: 60_000 },
    );
    await expect(tab.locator('#benchmark-output')).toContainText(
      `"release": "${release}"`,
    );
  }
});
test('a missing engine binary cannot claim readiness and an explicit retry completes the pack', async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  await page.goto('/technical.html');
  await expect(page.locator('#offline-status')).toContainText(
    'Shell installed',
  );
  expect((await request.put('/__test/block-engine')).ok()).toBe(true);
  await page
    .getByRole('button', { name: 'Download PG proof for offline', exact: true })
    .click();
  await expect(page.locator('#offline-status')).toContainText(
    'Offline download incomplete',
    { timeout: 30_000 },
  );
  expect((await request.put('/__test/unblock')).ok()).toBe(true);
  await page
    .getByRole('button', { name: 'Download PG proof for offline', exact: true })
    .click();
  await expect(page.locator('#offline-status')).toContainText(
    'PG/parser proof available offline',
    { timeout: 60_000 },
  );
});
test('a missing new shell asset does not replace the last working release', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await page.goto('/technical.html');
  await expect(page.locator('#offline-status')).toContainText(
    'Shell installed',
  );
  await page.reload();
  expect((await request.put('/__test/block-next-shell')).ok()).toBe(true);
  expect((await request.put('/__test/release', { data: 'b' })).ok()).toBe(true);
  await page
    .getByRole('button', { name: 'Check for update', exact: true })
    .click();
  await expect
    .poll(async () => {
      const stats: unknown = await (await request.get('/__test/stats')).json();
      return (
        typeof stats === 'object' &&
        stats !== null &&
        'blockedHits' in stats &&
        typeof stats.blockedHits === 'number' &&
        stats.blockedHits > 0
      );
    })
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.installing?.state ?? 'none';
      }),
    )
    .toBe('none');
  expect(
    await page.evaluate(
      async () => !!(await navigator.serviceWorker.getRegistration())?.waiting,
    ),
  ).toBe(false);
  await expect(page.locator('#proof-release')).toHaveText('Release test-a');
  await page.reload();
  await expect(page.locator('#proof-release')).toHaveText('Release test-a');
});
