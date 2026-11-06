import { expect, test } from '@playwright/test';

test('opt-in PG/parser pack survives offline reopen; install alone downloads no engine binaries @smoke', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const binaries: string[] = [];
  page.on('request', (request) => {
    if (/\.(wasm|data|snapshot)$/.test(request.url()))
      binaries.push(request.url());
  });
  await page.goto('/technical.html');
  await expect(page.locator('#offline-status')).toContainText(
    'Shell installed',
    { timeout: 20_000 },
  );
  expect(binaries).toEqual([]);
  const installed = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((entry) => entry.url),
        ),
      )
    ).flat(),
  );
  expect(
    installed.some((url) => /\.(?:wasm|data|snapshot)$|\.worker-/.test(url)),
  ).toBe(false);
  await page
    .getByRole('button', { name: 'Download PG proof for offline', exact: true })
    .click();
  await expect(page.locator('#offline-status')).toContainText(
    'PG/parser proof available offline',
    { timeout: 60_000 },
  );
  const downloaded = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((entry) => entry.url),
        ),
      )
    ).flat(),
  );
  expect(downloaded.some((url) => url.endsWith('.wasm'))).toBe(true);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#offline-status')).toContainText(
    'PG/parser proof available offline',
    { timeout: 20_000 },
  );
  for (const strategy of ['fresh initdb', 'shared snapshot']) {
    await page
      .getByRole('button', { name: `Benchmark ${strategy}`, exact: true })
      .click();
    await expect(page.locator('#benchmark-status')).toContainText(
      'Trial complete',
      { timeout: 60_000 },
    );
  }
  const reloadModeCachedWorker = await page.evaluate(async () => {
    const name = (await caches.keys()).find((key) =>
      key.startsWith('tqi-m0-pack-'),
    );
    if (!name) return false;
    const worker = (await (await caches.open(name)).keys()).find((entry) =>
      entry.url.includes('boot-benchmark.worker-'),
    );
    if (!worker || !(await fetch(worker.url)).ok) return false;
    // Cache API matching must work with a worker-style Request too. Firefox's
    // explicit fetch(cache:'reload') forces network offline, so do not test that
    // browser override as if it were this app's default offline path.
    return !!(await (
      await caches.open(name)
    ).match(new Request(worker.url, { cache: 'reload' })));
  });
  expect(reloadModeCachedWorker).toBe(true);
  await page.goto('/feasibility.html');
  await page
    .getByRole('button', { name: 'Run fixed PostgreSQL probes', exact: true })
    .click();
  await expect(page.locator('#probe-output')).toContainText('PostgreSQL 18.', {
    timeout: 60_000,
  });
  // Stronger than a reload: close the final page and create a fresh offline client.
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/technical.html');
  await expect(reopened.locator('#offline-status')).toContainText(
    'PG/parser proof available offline',
    { timeout: 20_000 },
  );
  await reopened
    .getByRole('button', { name: 'Benchmark shared snapshot', exact: true })
    .click();
  await expect(reopened.locator('#benchmark-status')).toContainText(
    'Trial complete',
    { timeout: 60_000 },
  );
});
