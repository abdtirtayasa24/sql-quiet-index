import { expect, it } from 'vitest';
import { LocalStore } from '../../src/storage/local';
it('stores only tiny settings and pointer, and validates unknown data', () => {
  const memory = new Map<string, string>();
  const local = new LocalStore(() => ({
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
  }));
  const settings = { locale: 'id', theme: 'light', motion: 'reduce' } as const;
  expect(local.saveSettings(settings)).toBe(true);
  expect(local.settings()).toEqual(settings);
  expect(
    local.savePointer({
      campaignId: 'c-one',
      updatedAt: '2026-11-01T00:00:00.000Z',
    }),
  ).toBe(true);
  expect(local.pointer().kind).toBe('present');
  memory.set('tqi.v1.savePointer', '{');
  expect(local.pointer().kind).toBe('invalid');
  memory.set(
    'tqi.v1.settings',
    '{"locale":"fr","theme":"unsafe","motion":null}',
  );
  expect(local.settings()).toEqual({
    locale: 'en',
    theme: 'system',
    motion: 'system',
  });
  expect([...memory.keys()].sort()).toEqual([
    'tqi.v1.savePointer',
    'tqi.v1.settings',
  ]);
});
it('denied storage never masquerades as a durable settings save', () => {
  const local = new LocalStore(() => {
    throw new DOMException('denied', 'SecurityError');
  });
  expect(local.pointer().kind).toBe('unavailable');
  expect(
    local.saveSettings({ locale: 'en', theme: 'dark', motion: 'reduce' }),
  ).toBe(false);
  expect(local.settings().locale).toBe('en');
});
