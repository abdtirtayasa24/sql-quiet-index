import { expect, it } from 'vitest';
import {
  canonicalJson,
  payloadHex,
  exportCaseFile,
} from '../../src/storage/export-import';
import { newCampaign } from '../../src/storage/schema';

it('sorts recursively including numeric-looking keys without reordering arrays', () => {
  expect(
    canonicalJson({ z: [3, 1, 1], '2': { b: true, a: null }, '10': 'é' }),
  ).toBe('{"10":"é","2":{"a":null,"b":true},"z":[3,1,1]}');
});
it('hashes canonical UTF-8 and excludes only the top-level integrity', async () => {
  expect(await payloadHex({})).toBe(
    '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a',
  );
  expect(await payloadHex({ b: 2, a: 1, integrity: 'ignored' })).toBe(
    '43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777',
  );
  const unicode = {
    prose: 'Bukti 🌧️ / café',
    nested: { integrity: 'retained' },
  };
  const expected = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalJson(unicode)),
  );
  expect(await payloadHex(unicode)).toBe(
    Array.from(new Uint8Array(expected), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join(''),
  );
});
it('rejects values JSON would silently lose or round and bounds recursion', () => {
  for (const value of [
    1n,
    undefined,
    NaN,
    Infinity,
    9007199254740992,
    new Date(),
    new Map(),
    { x: undefined },
  ])
    expect(() => canonicalJson(value)).toThrow();
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  expect(() => canonicalJson(cyclic)).toThrow();
});
it('exports all seven collections losslessly, not local operational stores or only active records', async () => {
  const campaign = newCampaign('en');
  const evidence = {
    campaignId: campaign.campaignId,
    saveVersion: 1,
    evidenceId: 'e-1',
    rowKeys: ['[20,"bigint:9007199254740993"]'],
    queryText: 'SELECT café',
    nested: { numeric: '12345678901234567890.0001' },
  };
  const source = {
    campaigns: [campaign],
    missionStates: [],
    attempts: [],
    evidence: [evidence],
    notes: [{ text: '記録' }],
    conceptEvents: [{ eventId: 'mastery' }],
    verdicts: [{ choices: ['protect'] }],
    backups: [{ private: 'local' }],
    meta: [{ key: 'local' }],
  };
  const result = JSON.parse(
    await exportCaseFile(source, '2026-11-01T00:00:00.000Z'),
  ) as Record<string, unknown>;
  expect(result.evidence).toEqual([evidence]);
  expect(result.notes).toEqual(source.notes);
  expect(result.conceptEvents).toEqual(source.conceptEvents);
  expect(result.verdicts).toEqual(source.verdicts);
  expect(result.backups).toBeUndefined();
  expect(result.meta).toBeUndefined();
  expect(result.integrity).toEqual({
    algorithm: 'SHA-256',
    payloadHex: await payloadHex(result),
  });
});
it('refuses to wrap unsupported native records in a current-version export', async () => {
  await expect(
    exportCaseFile({ campaigns: [{ ...newCampaign('en'), saveVersion: 99 }] }),
  ).rejects.toThrow('future');
});
it('takes a stable copy before asynchronous digest so callers cannot tear the export', async () => {
  const campaign = newCampaign('en');
  const original = campaign.seed;
  const pending = exportCaseFile({ campaigns: [campaign] });
  campaign.seed = 'ffffffff';
  expect(JSON.parse(await pending)).toMatchObject({
    campaigns: [{ seed: original }],
  });
});
