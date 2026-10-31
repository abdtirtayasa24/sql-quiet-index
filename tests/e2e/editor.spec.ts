import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { TqiSqlEditor } from '../../src/components/editor/tqi-sql-editor';

async function replaceSql(input: Locator, text: string) {
  await input.focus();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially(text);
}

async function open(page: Page) {
  await page.goto('/feasibility.html');
  const input = page.getByRole('textbox', {
    name: 'PostgreSQL query',
    exact: true,
  });
  await expect(input).toBeVisible({ timeout: 3000 });
  return input;
}

test('keeps one editor and selection/undo when schema and theme reconfigure @smoke', async ({
  page,
}) => {
  const input = await open(page);
  await replaceSql(input, 'SELECT staff_id FROM staff;');
  await input.press('ArrowLeft');
  await input.press('Shift+ArrowRight');
  const before = await input.elementHandle();
  const selection = await page.evaluate(
    () => (document.querySelector('tqi-sql-editor') as TqiSqlEditor).selection,
  );
  expect(Math.abs(selection.head - selection.anchor)).toBe(1);
  await page.evaluate(() => {
    const editor = document.querySelector('tqi-sql-editor') as TqiSqlEditor;
    editor.tables = [
      {
        name: 'gates',
        visible: true,
        columns: [{ name: 'gate_id', visible: true }],
      },
    ];
    editor.dark = !editor.dark;
    return editor.updateComplete;
  });
  expect(
    await input.evaluate((element, previous) => element === previous, before),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        (document.querySelector('tqi-sql-editor') as TqiSqlEditor).selection,
    ),
  ).toEqual(selection);
  await expect(input).toContainText('SELECT staff_id FROM staff;');
  await input.press('Control+z');
  await expect(input).toHaveText('SELECT 1;');
});

test('offers only visible table and column completions using PostgreSQL dialect', async ({
  page,
}) => {
  const input = await open(page);
  await replaceSql(input, 'SELECT * FROM ');
  await input.press('Control+Space');
  await expect(
    page.getByRole('option', { name: 'staff', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('option', { name: /answer_keys/ })).toHaveCount(
    0,
  );
  await input.press('Escape');
  await replaceSql(input, 'SELECT staff.');
  await input.press('Control+Space');
  await expect(
    page.getByRole('option', { name: 'staff_id', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('option', { name: /private_note/ })).toHaveCount(
    0,
  );
});

test('native fallback preserves draft, undo/redo, selection and keyboard intent', async ({
  page,
}) => {
  const input = await open(page);
  await replaceSql(input, 'SELECT 42;');
  await input.press('ArrowLeft');
  await input.press('Shift+ArrowRight');
  const selection = await page.evaluate(
    () => (document.querySelector('tqi-sql-editor') as TqiSqlEditor).selection,
  );
  expect(Math.abs(selection.head - selection.anchor)).toBe(1);
  await page.getByRole('button', { name: 'Use native editor' }).click();
  const native = page.getByRole('textbox', {
    name: 'PostgreSQL query',
    exact: true,
  });
  await expect(native).toHaveValue('SELECT 42;');
  await expect(native).toHaveJSProperty(
    'selectionStart',
    Math.min(selection.anchor, selection.head),
  );
  await expect(native).toHaveJSProperty(
    'selectionEnd',
    Math.max(selection.anchor, selection.head),
  );
  await expect(
    page.getByRole('status').filter({ hasText: 'Native textarea active' }),
  ).toBeVisible();
  await native.press('Control+z');
  await expect(native).toHaveValue('SELECT 1;');
  await native.press('Control+Shift+z');
  await expect(native).toHaveValue('SELECT 42;');
  await native.press('Control+Enter');
  await expect(page.locator('#ast-output')).toContainText('SelectStmt', {
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Use CodeMirror' }).click();
  await expect(page.locator('.cm-editor')).toHaveCount(1);
  await expect(native).toHaveText('SELECT 42;');
});

test('both Control and Command shortcuts inspect SQL without executing arbitrary statements', async ({
  page,
}) => {
  const input = await open(page);
  await replaceSql(input, 'SELECT FROM');
  await input.press('Meta+Enter');
  await expect(page.locator('#ast-output')).toContainText('syntax error', {
    timeout: 15_000,
  });
  await replaceSql(input, 'DELETE FROM staff; SELECT 2');
  await expect
    .poll(() =>
      page.evaluate(
        () => (document.querySelector('tqi-sql-editor') as TqiSqlEditor).value,
      ),
    )
    .toBe('DELETE FROM staff; SELECT 2');
  await input.press('Control+Enter');
  await expect(page.locator('#ast-output')).toContainText('DeleteStmt');
  await expect(page.locator('#parse-status')).toContainText('not executed');
});

test('falls back automatically if CodeMirror cannot mount', async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Exercise the real mount-error boundary, not a production test-only flag.
    const original: unknown = Object.getOwnPropertyDescriptor(
      Node.prototype,
      'appendChild',
    )?.value;
    if (typeof original !== 'function')
      throw new Error('Missing native appendChild');
    Node.prototype.appendChild = function <T extends Node>(node: T): T {
      if (this instanceof HTMLElement && this.id === 'editor-host')
        throw new Error('Audited incompatible editor mount');
      return Reflect.apply(original, this, [node]) as T;
    };
  });
  await open(page);
  await expect(page.locator('textarea')).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'Native textarea active' }),
  ).toContainText('CodeMirror could not mount');
});

test('emits debounced typed changes across Shadow DOM and retains draft after reconnect', async ({
  page,
}) => {
  const input = await open(page);
  await page.evaluate(() => {
    const editor = document.querySelector('tqi-sql-editor') as TqiSqlEditor;
    document.addEventListener('sql-change', (event) => {
      const intent = event as CustomEvent<{ sql: string }>;
      editor.dataset.lastChange = intent.detail.sql;
    });
  });
  await replaceSql(input, 'SELECT 7;');
  await expect(page.locator('tqi-sql-editor')).toHaveAttribute(
    'data-last-change',
    'SELECT 7;',
  );
  await page.evaluate(() => {
    const editor = document.querySelector('tqi-sql-editor') as TqiSqlEditor;
    const parent = editor.parentElement;
    if (!parent) throw new Error('Missing editor host');
    editor.remove();
    parent.append(editor);
  });
  await expect(input).toHaveText('SELECT 7;');
  await expect(page.locator('.cm-editor')).toHaveCount(1);
  await input.press('Control+z');
  await expect(input).toHaveText('SELECT 1;');
});

test('reports a missing worker and keeps the editable draft available', async ({
  page,
}) => {
  await page.route('**/postgres.worker-*.js', (route) => route.abort());
  const input = await open(page);
  await replaceSql(input, 'SELECT 9;');
  await page.getByRole('button', { name: 'Inspect SQL', exact: true }).click();
  await expect(page.locator('#parse-status')).toContainText(
    'ENGINE_UNAVAILABLE',
  );
  await expect(input).toHaveText('SELECT 9;');
  await page.getByRole('button', { name: 'Use native editor' }).click();
  await expect(page.locator('textarea')).toHaveValue('SELECT 9;');
});
