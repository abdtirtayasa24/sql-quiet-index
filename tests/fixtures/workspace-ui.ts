import type { Locator } from '@playwright/test';
export async function typeSql(input: Locator, sql: string) {
  if (!(await input.isVisible()))
    await input.page().getByRole('tab', { name: 'Query', exact: true }).click();
  await input.focus();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially(sql);
  await input.press('Escape');
}
