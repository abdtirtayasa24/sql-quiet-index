import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type * as Fixture from '../fixtures/storage-browser';

test.beforeEach(async ({ page }) => {
  await page.route('**/__storage-fixture.js', (route) =>
    route.fulfill({
      path: resolve('generated/storage-fixture/fixture.js'),
      contentType: 'text/javascript',
    }),
  );
});
test('explicit creation, draft reload and settings persist on the built desk @storage', async ({
  page,
}) => {
  await page.goto('/storage.html');
  await page.getByRole('button', { name: 'Create local case file' }).click();
  const id = await page.locator('[data-campaign]').textContent();
  await page.getByLabel('SQL draft').fill('SELECT 42; -- private local work');
  await expect(page.locator('[data-save-status]')).toContainText(
    'Draft saved locally',
  );
  await page.getByLabel('Theme', { exact: true }).selectOption('light');
  await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
  await page.reload();
  await expect(page.locator('[data-campaign]')).toHaveText(id ?? '');
  await expect(page.getByLabel('SQL draft')).toHaveValue(
    'SELECT 42; -- private local work',
  );
  await expect(page.getByLabel('Theme', { exact: true })).toHaveValue('light');
  await expect(page.getByLabel('Motion', { exact: true })).toHaveValue(
    'reduce',
  );
  await page.getByLabel('Language', { exact: true }).selectOption('id');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(page.locator('#storage-locale')).toHaveValue('id');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Berkas perkara tetap bersama Anda.',
  );
});
test('hidden visibility commits immediate input without waiting for the 500ms debounce @storage', async ({
  page,
}) => {
  await page.goto('/storage.html');
  await page.getByRole('button', { name: 'Create local case file' }).click();
  await expect(page.getByLabel('SQL draft')).toBeEnabled();
  await page.clock.install();
  await page.getByLabel('SQL draft').fill('SELECT 7; -- hidden flush');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('[data-save-status]')).toContainText(
    'Draft saved locally',
  );
  await page.reload();
  await expect(page.getByLabel('SQL draft')).toHaveValue(
    'SELECT 7; -- hidden flush',
  );
});
test('partial and complete eviction are honest states and never auto-create a campaign @storage', async ({
  page,
}) => {
  await page.goto('/storage.html');
  await page.evaluate(() =>
    localStorage.setItem(
      'tqi.v1.savePointer',
      JSON.stringify({
        campaignId: 'gone',
        updatedAt: new Date().toISOString(),
      }),
    ),
  );
  await page.reload();
  await expect(page.locator('[data-storage-issue]')).toContainText('Import');
  await expect(
    page.getByRole('button', { name: 'Create local case file' }),
  ).toHaveCount(0);
  await page.evaluate(() => localStorage.removeItem('tqi.v1.savePointer'));
  await page.reload();
  await page.getByRole('button', { name: 'Create local case file' }).click();
  await expect(page.locator('[data-campaign]')).toBeVisible();
  // Simulate whole-origin eviction only in this isolated synthetic test context.
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.deleteDatabase('tqi-progress-v1');
      r.onsuccess = () => resolve();
      r.onerror = () => reject(new Error('Fixture eviction failed'));
    });
  });
  await page.goto('/storage.html');
  await expect(
    page.getByRole('button', { name: 'Create local case file' }),
  ).toBeEnabled();
  await expect(page.locator('[data-campaign]')).toHaveCount(0);
});
test('denied convenience settings do not disable canonical draft saves @storage', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  });
  await page.goto('/storage.html');
  await page.getByRole('button', { name: 'Create local case file' }).click();
  await page.getByLabel('SQL draft').fill('SELECT 9;');
  await expect(page.locator('[data-save-status]')).toContainText(
    'Draft saved locally',
  );
  await page.getByLabel('Theme', { exact: true }).selectOption('dark');
  await expect(page.locator('[data-settings-status]')).toContainText(
    'not saved',
  );
  await page.reload();
  await expect(page.getByLabel('SQL draft')).toHaveValue('SELECT 9;');
});
test('a future save offers a real read-only recovery download without dropping unknown data @storage', async ({
  page,
}, info) => {
  await page.goto('/storage.html');
  await page.getByRole('button', { name: 'Create local case file' }).click();
  const id = await page.locator('[data-campaign]').textContent();
  await page.evaluate(async (id) => {
    if (!id) throw new Error('Missing campaign');
    const url = '/__storage-fixture.js';
    const { openProgress } = (await import(url)) as typeof Fixture;
    const repo = await openProgress();
    await repo.migrateCampaign(id, 2, {
      1: (copy) => ({
        ...copy,
        campaigns: (copy.campaigns ?? []).map((row) => {
          if (typeof row !== 'object' || row === null)
            throw new Error('Invalid fixture');
          return { ...row, futurePrivateField: 'preserve verbatim' };
        }),
      }),
    });
    repo.close();
  }, id);
  await page.reload();
  await expect(page.locator('[data-storage-issue]')).toContainText(
    'newer release',
  );
  await expect(
    page.getByRole('button', { name: 'Create local case file' }),
  ).toHaveCount(0);
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery copy' }).click();
  const path = info.outputPath('future-recovery.json');
  await (await waiting).saveAs(path);
  const content: unknown = JSON.parse(readFileSync(path, 'utf8'));
  expect(content).toMatchObject({
    records: {
      campaigns: [{ saveVersion: 2, futurePrivateField: 'preserve verbatim' }],
    },
  });
});
test('quota recovery download retains latest work and safe retry commits it @storage', async ({
  page,
}, info) => {
  await page.goto('/storage.html');
  await page.getByRole('button', { name: 'Create local case file' }).click();
  await page.getByLabel('SQL draft').fill('SELECT 1;');
  await expect(page.locator('[data-save-status]')).toContainText(
    'Draft saved locally',
  );
  await page.evaluate(() => {
    const original = Reflect.get<IDBObjectStore, 'put'>(
      IDBObjectStore.prototype,
      'put',
    );
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (this.name === 'missionStates') {
        IDBObjectStore.prototype.put = original;
        throw new DOMException('injected', 'QuotaExceededError');
      }
      return original.call(this, value, key);
    };
  });
  await page.getByLabel('SQL draft').fill('SELECT 2; -- keep unsaved');
  await expect(page.locator('[data-save-status]')).toContainText(
    'Writes paused',
  );
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery copy' }).click();
  const download = await waiting;
  const path = info.outputPath('recovery.json');
  await download.saveAs(path);
  const recovery: unknown = JSON.parse(readFileSync(path, 'utf8'));
  expect(recovery).toMatchObject({
    records: { missionStates: [{ lastDraft: 'SELECT 1;' }] },
    unsavedDraft: { text: 'SELECT 2; -- keep unsaved', state: 'paused' },
  });
  await page.getByRole('button', { name: 'Retry storage safely' }).click();
  await expect(page.locator('[data-save-status]')).toContainText(
    'Draft saved locally',
  );
  await page.reload();
  await expect(page.getByLabel('SQL draft')).toHaveValue(
    'SELECT 2; -- keep unsaved',
  );
});
test('disposable cache removal and a real PG worker termination cannot erase canonical progress @storage', async ({
  page,
}) => {
  await page.goto('/storage.html');
  await page.getByRole('button', { name: 'Create local case file' }).click();
  await page.getByLabel('SQL draft').fill('SELECT 11;');
  await expect(page.locator('[data-save-status]')).toContainText(
    'Draft saved locally',
  );
  const workerName = readdirSync('dist/assets').find((file) =>
    /^postgres\.worker-.*\.js$/.test(file),
  );
  if (!workerName) throw new Error('Built PG worker missing');
  const result = await page.evaluate(async (workerUrl) => {
    const url = '/__storage-fixture.js';
    const { openProgress, isEngineResponse } = (await import(
      url
    )) as typeof Fixture;
    const repo = await openProgress();
    const before = await repo.snapshot();
    const worker = new Worker(workerUrl, { type: 'module' });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error('PG probe deadline'));
      }, 15000);
      worker.onerror = () => {
        clearTimeout(timer);
        reject(new Error('PG probe failed'));
      };
      worker.onmessage = (event: MessageEvent<unknown>) => {
        if (isEngineResponse(event.data)) {
          clearTimeout(timer);
          if (
            event.data.type === 'PROBE_RESULT' &&
            event.data.results.length === 5
          )
            resolve();
          else reject(new Error('PG probe rejected'));
        }
      };
      worker.postMessage({
        type: 'PROBE',
        sessionId: 'cp1a-disposable-proof',
        requestId: 1,
      });
    });
    worker.terminate();
    const disposable = await caches.open('tqi-cp1a-disposable-test');
    await disposable.put('/disposable', new Response('rebuildable'));
    for (const name of await caches.keys()) await caches.delete(name);
    const after = await repo.snapshot();
    repo.close();
    return { before, after };
  }, `/assets/${workerName}`);
  expect(result.after).toEqual(result.before);
  await page.reload();
  await expect(page.getByLabel('SQL draft')).toHaveValue('SELECT 11;');
});
