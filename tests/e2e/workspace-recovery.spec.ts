import { expect, test } from '@playwright/test';
import { typeSql } from '../fixtures/workspace-ui';
import { readFile } from 'node:fs/promises';
import { caseCollections } from '../fixtures/save-file';
import { exportCaseFile } from '../../src/storage/export-import';
import { validateCaseFile } from '../../src/storage/import-validator';

test('workspace run/reset/export preserves imported solved IDs and every non-draft collection', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const source = caseCollections();
  await page.goto('/#/settings');
  await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
    name: 'practice-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(await exportCaseFile(source)),
  });
  await page.getByLabel('Import mode', { exact: true }).selectOption('merge');
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Confirm merge', exact: true })
    .click();
  await expect(
    page.getByText('Import committed.', { exact: true }),
  ).toBeVisible();
  await page.goto('/workspace.html');
  const run = page.getByRole('button', { name: 'Run SQL', exact: true });
  await expect(run).toBeEnabled({ timeout: 60000 });
  await typeSql(
    page.getByRole('textbox', { name: 'PostgreSQL query' }),
    'SELECT count(*) FROM practice_records',
  );
  await run.click();
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('cell')).toHaveText('240');
  await page.getByRole('tab', { name: 'Query', exact: true }).click();
  await page.getByRole('button', { name: 'Reset practice database' }).click();
  await page
    .getByRole('button', { name: 'Reset database', exact: true })
    .click();
  await expect(run).toBeEnabled({ timeout: 60000 });
  await page.getByRole('link', { name: 'Export / import case file' }).click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export saved case file', exact: true })
    .click();
  const path = info.outputPath('workspace-roundtrip.json');
  await (await download).saveAs(path);
  const restored = await validateCaseFile(await readFile(path, 'utf8'));
  for (const name of [
    'attempts',
    'evidence',
    'notes',
    'conceptEvents',
    'verdicts',
  ] as const)
    expect(restored[name]).toEqual(source[name]);
  expect(
    restored.campaigns.map((c) => [
      c.campaignId,
      c.seed,
      c.completedMissionIds,
    ]),
  ).toEqual(
    source.campaigns.map((c) => [c.campaignId, c.seed, c.completedMissionIds]),
  );
});
test('cancel during expensive query, recover exact seed, preserve draft on navigation/export and independent tabs', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  const run = page.getByRole('button', { name: 'Run SQL', exact: true });
  await expect(run).toBeEnabled({ timeout: 60000 });
  const editor = page.getByRole('textbox', { name: 'PostgreSQL query' });
  await typeSql(editor, 'SELECT sum(amount) FROM practice_records');
  await run.click();
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  const total = await page.getByRole('cell').innerText();
  const other = await context.newPage();
  await other.goto('/workspace.html');
  await expect(
    other.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await typeSql(
    editor,
    'SELECT count(*) FROM practice_records a JOIN practice_records b ON true JOIN practice_records c ON true JOIN practice_records d ON true',
  );
  await run.click();
  await expect(page.locator('tqi-status')).toContainText(
    /budget|worker stopped/,
    { timeout: 15000 },
  );
  if (
    await page
      .getByRole('button', { name: 'Rebuild practice database', exact: true })
      .isVisible()
  )
    await page
      .getByRole('button', { name: 'Rebuild practice database', exact: true })
      .click();
  else {
    await page.getByRole('button', { name: 'Reset practice database' }).click();
    await page
      .getByRole('button', { name: 'Reset database', exact: true })
      .click();
  }
  await expect(run).toBeEnabled({ timeout: 60000 });
  await typeSql(editor, 'SELECT sum(amount) FROM practice_records');
  await run.click();
  await page.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('cell')).toHaveText(total);
  await typeSql(
    other.getByRole('textbox', { name: 'PostgreSQL query' }),
    'SELECT count(*) FROM practice_records',
  );
  await other.getByRole('button', { name: 'Run SQL', exact: true }).click();
  await other.getByRole('tab', { name: 'Results', exact: true }).click();
  await expect(other.getByRole('cell')).toHaveText('240');
  await typeSql(editor, 'SELECT record_id FROM practice_records LIMIT 2');
  await page.getByRole('link', { name: 'Export / import case file' }).click();
  await expect(page).toHaveURL(/#\/settings$/);
  await page.goto('/workspace.html');
  await expect(
    page.getByRole('textbox', { name: 'PostgreSQL query' }),
  ).toContainText('SELECT record_id FROM practice_records LIMIT 2');
});
test('closing a running worker and reopening restores its last committed draft', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  const run = page.getByRole('button', { name: 'Run SQL', exact: true });
  await expect(run).toBeEnabled({ timeout: 60000 });
  const sql =
    'SELECT count(*) FROM practice_records a JOIN practice_records b ON true JOIN practice_records c ON true JOIN practice_records d ON true';
  await typeSql(page.getByRole('textbox', { name: 'PostgreSQL query' }), sql);
  await run.click();
  await expect(page.locator('[data-save-status]')).toContainText('saved');
  await page.close();
  const fresh = await context.newPage();
  await fresh.goto('/workspace.html');
  await expect(
    fresh.getByRole('textbox', { name: 'PostgreSQL query' }),
  ).toContainText(sql);
  await expect(
    fresh.getByRole('button', { name: 'Run SQL', exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await expect(fresh.getByRole('table')).toHaveCount(0);
});
test('reset while running invalidates late results without clearing canonical records', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/workspace.html');
  await page
    .getByRole('button', { name: 'Create local practice file' })
    .click();
  const run = page.getByRole('button', { name: 'Run SQL', exact: true });
  await expect(run).toBeEnabled({ timeout: 60000 });
  const editor = page.getByRole('textbox', { name: 'PostgreSQL query' });
  const sql =
    'SELECT count(*) FROM practice_records a JOIN practice_records b ON true JOIN practice_records c ON true JOIN practice_records d ON true';
  await typeSql(editor, sql);
  await run.click();
  await page.getByRole('button', { name: 'Reset practice database' }).click();
  await page
    .getByRole('button', { name: 'Reset database', exact: true })
    .click();
  await expect(run).toBeEnabled({ timeout: 60000 });
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(editor).toContainText(sql);
  await expect(page.locator('[data-save-status]')).toContainText('saved');
});
