import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { exportCaseFile } from '../../src/storage/export-import';
import { validateCaseFile } from '../../src/storage/import-validator';
import { caseCollections } from '../fixtures/save-file';
import type * as Fixture from '../fixtures/storage-browser';
test.beforeEach(async ({ page }) => {
  await page.route('**/__storage-fixture.js', (route) =>
    route.fulfill({
      path: resolve('generated/storage-fixture/fixture.js'),
      contentType: 'text/javascript',
    }),
  );
  await page.goto('/#/settings');
});
test('real File preview does not write; confirmed merge and Blob download round-trip every collection @portable', async ({
  page,
}, info) => {
  const source = caseCollections();
  const text = await exportCaseFile(source);
  await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
    name: 'case.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
  await expect(
    page.getByText('Selected file: case.json', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Review before importing' }),
  ).toBeVisible();
  const empty = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const f = (await import(url)) as typeof Fixture;
    const repo = await f.openProgress();
    const raw = await repo.snapshot();
    repo.close();
    return raw.campaigns;
  });
  expect(empty).toEqual([]);
  await page.getByLabel('Import mode', { exact: true }).selectOption('merge');
  await expect(
    page.getByRole('button', { name: 'Confirm merge', exact: true }),
  ).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Confirm merge', exact: true })
    .click();
  await expect(
    page.getByText('Import committed.', { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export saved case file', exact: true })
    .click();
  const file = await download;
  const path = info.outputPath('round-trip.json');
  await file.saveAs(path);
  const restored = await validateCaseFile(await readFile(path, 'utf8'));
  for (const name of Object.keys(source) as (keyof typeof source)[])
    expect(restored[name]).toEqual(source[name]);
});
test('new copy keeps original campaign and remaps nested references, not database row keys @portable', async ({
  page,
}) => {
  await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const f = (await import(url)) as typeof Fixture;
    const r = await f.openProgress();
    await r.importCaseFile(
      await f.validateCaseFile(await f.exportCaseFile(f.caseCollections())),
      'merge',
      true,
    );
    r.close();
  });
  await page.reload();
  await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
    name: 'copy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(await exportCaseFile(caseCollections())),
  });
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Confirm new copy', exact: true })
    .click();
  await expect(
    page.getByText('Import committed.', { exact: true }),
  ).toBeVisible();
  const raw = await page.evaluate(async () => {
    const url = '/__storage-fixture.js';
    const f = (await import(url)) as typeof Fixture;
    const r = await f.openProgress();
    const data = await r.snapshot();
    r.close();
    return data;
  });
  expect(raw.campaigns).toHaveLength(2);
  expect(raw.notes).toContainEqual(caseCollections().notes[0]);
  const copied = raw.evidence?.find(
    (row) =>
      typeof row === 'object' &&
      row !== null &&
      'campaignId' in row &&
      row.campaignId !== 'c-test',
  );
  expect(copied).toMatchObject({
    selectedRecordRefs: [{ pk: '9007199254740993' }],
  });
});
test('future file is read-only and original-byte download does not transcode BOM/Unicode/whitespace @portable', async ({
  page,
}, info) => {
  const original = Buffer.from('\ufeff  {"saveVersion":99,"future":"🌧️"}\n');
  await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
    name: 'future.json',
    mimeType: 'application/json',
    buffer: original,
  });
  await expect(
    page.getByText('Unsupported save version', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  const pending = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download original file', exact: true })
    .click();
  const download = await pending;
  const path = info.outputPath('original.json');
  await download.saveAs(path);
  expect(await readFile(path)).toEqual(original);
});
test('invalid imports show actionable errors and never create or replace canonical data @portable', async ({
  page,
}) => {
  const valid = await exportCaseFile(caseCollections());
  const corrupt = valid.replace('cp1a-storage-1', 'cp1b-tampered');
  for (const [text, message] of [
    [corrupt, 'integrity check'],
    ['{"__proto__":{}}', 'unsafe object key'],
    ['x'.repeat(5 * 1024 * 1024 + 1), '5 MiB'],
  ] as const) {
    await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });
    await expect(page.getByRole('alert')).toContainText(message);
  }
  const rows = await page.evaluate(async () => {
    const u = '/__storage-fixture.js';
    const f = (await import(u)) as typeof Fixture;
    const r = await f.openProgress();
    const x = await r.snapshot();
    r.close();
    return x.campaigns;
  });
  expect(rows).toEqual([]);
});
test('confirmed canonical import recovers a corrupt convenience pointer without clearing storage @portable', async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem('tqi.v1.savePointer', '{broken'),
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Local records need attention' }),
  ).toBeVisible();
  await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
    name: 'case.json',
    mimeType: 'application/json',
    buffer: Buffer.from(await exportCaseFile(caseCollections())),
  });
  await page.getByLabel('Import mode', { exact: true }).selectOption('merge');
  await expect(page.getByRole('checkbox')).toBeEnabled();
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Confirm merge', exact: true })
    .click();
  await expect(
    page.getByText('Import committed.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Settings / safe storage', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate((): unknown =>
      JSON.parse(localStorage.getItem('tqi.v1.savePointer') ?? 'null'),
    ),
  ).toMatchObject({ campaignId: 'c-test' });
});
test('unsupported local schema permits file preview but disables import confirmation @portable', async ({
  page,
}) => {
  await page.evaluate(async () => {
    const r = indexedDB.open('tqi-progress-v1', 2);
    await new Promise<void>((resolve, reject) => {
      r.onsuccess = () => {
        r.result.close();
        resolve();
      };
      r.onerror = () => reject(r.error ?? new Error('Native open failed'));
    });
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Read-only compatibility notice' }),
  ).toBeVisible();
  await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
    name: 'case.json',
    mimeType: 'application/json',
    buffer: Buffer.from(await exportCaseFile(caseCollections())),
  });
  await expect(
    page.getByRole('heading', { name: 'Review before importing' }),
  ).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Confirm new copy', exact: true }),
  ).toBeDisabled();
});
test('changing import mode requires renewed consent @portable', async ({
  page,
}) => {
  await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
    name: 'case.json',
    mimeType: 'application/json',
    buffer: Buffer.from(await exportCaseFile(caseCollections())),
  });
  await page.getByRole('checkbox').check();
  await expect(
    page.getByRole('button', { name: 'Confirm new copy', exact: true }),
  ).toBeEnabled();
  await page.getByLabel('Import mode', { exact: true }).selectOption('merge');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Confirm merge', exact: true }),
  ).toBeDisabled();
});
