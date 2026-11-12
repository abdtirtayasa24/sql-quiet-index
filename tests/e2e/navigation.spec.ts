import { expect, test } from '@playwright/test';
test('built static direct hash routes explain locks and keep heading focus through back/forward @portable @smoke', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(new URL(r.url()).pathname));
  await page.goto('/#/mission/021');
  await expect(
    page.getByRole('heading', { name: 'Mission 021 is locked' }),
  ).toBeVisible();
  await expect(
    page.getByText(/not published in this checkpoint/),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Settings / safe storage', exact: true }),
  ).toBeFocused();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Mission 021 is locked' }),
  ).toBeFocused();
  await page.goForward();
  await expect(
    page.getByRole('heading', { name: 'Settings / safe storage', exact: true }),
  ).toBeFocused();
  for (const hash of [
    '#/home',
    '#/act/03',
    '#/casebook',
    '#/practice',
    '#/unknown',
  ]) {
    await page.goto('/' + hash);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
  }
  expect(
    requests.some(
      (path) => path.startsWith('/api/') || path.startsWith('/mission/'),
    ),
  ).toBe(false);
});
test('unavailable native storage yields an actionable recovery state without resetting the origin @portable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = function () {
      throw new DOMException('injected', 'SecurityError');
    };
  });
  await page.goto('/#/home');
  await expect(
    page.getByRole('heading', { name: 'Local records need attention' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Local recovery desk', exact: true }),
  ).toBeVisible();
});
test('skip link focuses the main landmark without destroying the hash route @portable', async ({
  page,
}) => {
  await page.goto('/#/settings');
  await expect(
    page.getByRole('heading', { name: 'Settings / safe storage', exact: true }),
  ).toBeVisible();
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveURL(/#\/settings$/);
});
test('BFCache lifecycle resumes routes without discarding portable state @portable', async ({
  page,
}) => {
  await page.goto('/#/home');
  await expect(
    page.getByRole('heading', { name: 'Your investigations' }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true }),
    );
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true }),
    );
  });
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Settings / safe storage', exact: true }),
  ).toBeVisible();
});
test('a surviving missing save pointer still opens recovery on routed startup @portable', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'tqi.v1.savePointer',
      JSON.stringify({
        campaignId: 'c-missing',
        updatedAt: '2026-11-01T00:00:00.000Z',
      }),
    ),
  );
  await page.goto('/#/home');
  await expect(
    page.getByRole('heading', { name: 'Local records need attention' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'saved campaign is missing',
  );
});
test('a future physical schema is explicitly read-only, not a missing-browser-feature notice @portable', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const request = indexedDB.open('tqi-progress-v1', 2);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('campaigns', { keyPath: 'campaignId' });
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () =>
        reject(request.error ?? new Error('Native open failed'));
    });
  });
  await page.goto('/#/settings');
  await expect(
    page.getByRole('heading', { name: 'Read-only compatibility notice' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Newer local records remain read-only. Keep a recovery copy and reopen a compatible release.',
      { exact: true },
    ),
  ).toBeVisible();
});
test('late bootstrap completion cannot overwrite a versionchange recovery notice @portable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Reflect.get<IDBDatabase, 'transaction'>(
      IDBDatabase.prototype,
      'transaction',
    );
    IDBDatabase.prototype.transaction = function (
      stores: string | Iterable<string>,
      mode?: IDBTransactionMode,
      options?: IDBTransactionOptions,
    ) {
      const tx = original.call(this, stores, mode, options);
      Object.defineProperty(tx, 'oncomplete', {
        set(handler: EventListener) {
          tx.addEventListener('complete', (event) => {
            setTimeout(() => {
              handler.call(tx, event);
              Reflect.set(window, 'snapshotReleased', true);
            }, 1800);
          });
        },
      });
      return tx;
    };
  });
  await page.goto('/#/home');
  await expect(page.locator('#route-status')).toBeVisible();
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
  await expect(
    page.getByRole('heading', { name: 'Local records need attention' }),
  ).toBeVisible();
  await page.waitForFunction(
    () => Reflect.get(window, 'snapshotReleased') === true,
  );
  await expect(
    page.getByRole('heading', { name: 'Local records need attention' }),
  ).toBeVisible();
});
