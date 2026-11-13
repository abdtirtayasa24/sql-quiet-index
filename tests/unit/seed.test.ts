import { expect, it } from 'vitest';
import { hashSeed, missionRng, mulberry32 } from '../../src/content/seed';
import { caseIdentities } from '../../src/content/case-identities';

it('matches independent FNV-1a and normative mulberry32 golden vectors', () => {
  expect(hashSeed('')).toBe(2166136261);
  expect(hashSeed('hello')).toBe(1335831723);
  const rng = mulberry32(1);
  expect([rng(), rng(), rng()]).toEqual([
    0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
  ]);
  const a = missionRng('00000001', '003', 0);
  const b = mulberry32(hashSeed('00000001:003:0'));
  expect(Array.from({ length: 20 }, () => a())).toEqual(
    Array.from({ length: 20 }, () => b()),
  );
});
it('shares case facts across missions/variants and versions their identity mapping', () => {
  const a = caseIdentities('2026.10.1', '00000001', 'act03');
  expect(caseIdentities('2026.10.1', '00000001', 'act03')).toEqual(a);
  expect(new Set(Object.values(a.staff))).toHaveLength(5);
  expect(caseIdentities('2026.10.2', '00000001', 'act03')).not.toEqual(a);
  expect(caseIdentities('2026.10.1', '00000002', 'act03')).not.toEqual(a);
  expect(caseIdentities('2026.10.1', '00000001', 'act02')).not.toEqual(a);
});
it('rejects malformed tuple inputs rather than silently creating different data', () => {
  for (const seed of ['ABCDEF12', 'abc', "00000001';DROP"]) {
    expect(() => missionRng(seed, '003')).toThrow();
    expect(() => caseIdentities('v1', seed, 'act03')).toThrow();
  }
  expect(() => missionRng('00000001', '081')).toThrow();
  expect(() => missionRng('00000001', '003', -1)).toThrow();
  expect(() => missionRng('00000001', '003', 0.5)).toThrow();
  expect(() => caseIdentities('', '00000001', 'act03')).toThrow();
});
