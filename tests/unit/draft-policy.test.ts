import { expect, it } from 'vitest';
import { compareDrafts } from '../../src/storage/draft-policy';
it('uses UTC time then stable tab ID then same-tab revision, independent of arrival order', () => {
  const a = { updatedAt: '2026-11-01T00:00:00.000Z', tabId: 'a', revision: 2 };
  expect(
    compareDrafts(a, {
      ...a,
      updatedAt: '2026-11-02T00:00:00.000Z',
      tabId: '0',
    }),
  ).toBeLessThan(0);
  expect(compareDrafts(a, { ...a, tabId: 'b', revision: 1 })).toBeLessThan(0);
  expect(compareDrafts(a, { ...a, revision: 3 })).toBeLessThan(0);
  expect(compareDrafts(a, a)).toBe(0);
});
