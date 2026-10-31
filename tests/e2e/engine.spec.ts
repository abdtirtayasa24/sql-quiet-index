import { expect, test } from '@playwright/test';

test('runs the fixed PostgreSQL 18 probes in a built dedicated worker @smoke', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const assets: { url: string; status: number; mime: string }[] = [];
  const workers: string[] = [];
  const workerPolicies: string[] = [];
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('worker', (worker) => workers.push(worker.url()));
  page.on('response', (response) => {
    if (/\/postgres\.worker-.*\.js$/.test(response.url()))
      workerPolicies.push(response.headers()['content-security-policy'] ?? '');
    if (/\.(wasm|data)(?:\?|$)/.test(response.url()))
      assets.push({
        url: response.url(),
        status: response.status(),
        mime: response.headers()['content-type'] ?? '',
      });
  });
  await page.goto('/feasibility.html');
  await expect(
    page.getByRole('textbox', { name: 'PostgreSQL query', exact: true }),
  ).toBeVisible();
  expect(workers).toHaveLength(0);
  expect(assets).toHaveLength(0);
  await page
    .getByRole('button', { name: 'Run fixed PostgreSQL probes' })
    .click({ timeout: 3000 });
  const output = page.locator('#probe-output');
  await expect(output).toContainText('PostgreSQL 18.', { timeout: 60_000 });
  const results: unknown = JSON.parse(await output.innerText());
  expect(results).toMatchObject([
    { name: 'version', rows: [[expect.stringContaining('PostgreSQL 18.')]] },
    { name: 'date_trunc', rows: [['2028-11-04 00:00:00+00']] },
    { name: 'distinct_on', rows: [[1, 3]] },
    { name: 'cte_window', rows: [['1']] },
    {
      name: 'explain_json',
      rows: [[[expect.objectContaining({ Plan: expect.any(Object) })]]],
    },
  ]);
  expect(workers).toHaveLength(1);
  expect(workerPolicies).toHaveLength(1);
  expect(workerPolicies[0]).toContain("script-src 'self' 'wasm-unsafe-eval'");
  expect(workerPolicies[0]).not.toContain("'unsafe-eval'");
  expect(errors).toEqual([]);
  expect(workers[0]).toMatch(/\/assets\/postgres\.worker-.*\.js$/);
  expect(assets.some((asset) => asset.url.endsWith('.data'))).toBe(true);
  expect(
    assets.filter((asset) => asset.url.endsWith('.wasm')).length,
  ).toBeGreaterThanOrEqual(2);
  for (const asset of assets) {
    expect(new URL(asset.url).origin).toBe('http://127.0.0.1:4173');
    expect(asset.status).toBe(200);
    if (asset.url.endsWith('.wasm'))
      expect(asset.mime).toContain('application/wasm');
    else expect(asset.mime).toContain('application/octet-stream');
  }
  await testInfo.attach('actual-worker-assets', {
    body: JSON.stringify({ workers, assets }, null, 2),
    contentType: 'application/json',
  });
});
