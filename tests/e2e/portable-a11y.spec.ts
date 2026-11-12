import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { exportCaseFile } from '../../src/storage/export-import';
import { caseCollections } from '../fixtures/save-file';
for (const colorScheme of ['dark', 'light'] as const) {
  test(`portable preview/error/read-only axe and reflow ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/#/settings');
    const inspect = async () => {
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
    };
    await expect(page.locator('h1')).toHaveText('Settings / safe storage');
    await inspect();
    await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
      name: 'case.json',
      mimeType: 'application/json',
      buffer: Buffer.from(await exportCaseFile(caseCollections())),
    });
    await expect(
      page.getByRole('heading', { name: 'Review before importing' }),
    ).toBeFocused();
    await inspect();
    for (const width of [320, 360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{'),
    });
    await expect(page.getByRole('alert')).toBeFocused();
    await inspect();
    await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
      name: 'future.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"saveVersion":99}'),
    });
    await expect(
      page.getByRole('heading', { name: 'Unsupported save version' }),
    ).toBeFocused();
    await inspect();
  });
  test(`portable keyboard confirmation and pointer targets ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#/settings');
    await page.getByLabel('Choose case file', { exact: true }).setInputFiles({
      name: 'case.json',
      mimeType: 'application/json',
      buffer: Buffer.from(await exportCaseFile(caseCollections())),
    });
    await expect(
      page.getByRole('heading', { name: 'Review before importing' }),
    ).toBeFocused();
    await expect(page.getByRole('checkbox')).toBeEnabled();
    await page.getByRole('checkbox').focus();
    await expect(page.getByRole('checkbox')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox')).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Confirm new copy', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(
      page.getByText('Import committed.', { exact: true }),
    ).toBeFocused();
    for (const button of await page.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
}
