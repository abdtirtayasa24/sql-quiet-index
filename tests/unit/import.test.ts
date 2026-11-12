import { expect, it } from 'vitest';
import { validateCaseFile } from '../../src/storage/import-validator';
import {
  exportCaseFile,
  canonicalJson,
  payloadHex,
} from '../../src/storage/export-import';
import { MAX_FILE_BYTES } from '../../src/types/case-file';
import { caseCollections } from '../fixtures/save-file';
async function file() {
  return JSON.parse(await exportCaseFile(caseCollections())) as Record<
    string,
    unknown
  >;
}
async function signed(value: Record<string, unknown>) {
  value.integrity = {
    algorithm: 'SHA-256',
    payloadHex: await payloadHex(value),
  };
  return canonicalJson(value);
}
it('round-trips complete Unicode/numeric-string/provenance collections after real SHA-256', async () => {
  const source = caseCollections();
  const result = await validateCaseFile(await exportCaseFile(source));
  for (const key of Object.keys(source) as (keyof typeof source)[])
    expect(result[key]).toEqual(source[key]);
});
it('checks total UTF-8 bytes, not JS character count, before parse/schema work', async () => {
  await expect(
    validateCaseFile('🌧'.repeat(MAX_FILE_BYTES / 4 + 1)),
  ).rejects.toThrow('size');
  await expect(validateCaseFile('{')).rejects.toThrow('json');
});
it('rejects pollution keys recursively, including constructor/prototype in arrays', async () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const raw = await file();
    raw.notes = [{ [key]: { polluted: true } }];
    await expect(validateCaseFile(await signed(raw))).rejects.toThrow(
      'pollution',
    );
  }
  expect(Reflect.get(Object.prototype, 'polluted')).toBeUndefined();
});
it('rejects corrupt integrity and unsupported algorithms without coercion', async () => {
  const raw = await file();
  raw.appVersion = 'changed';
  await expect(validateCaseFile(canonicalJson(raw))).rejects.toThrow(
    'integrity',
  );
  raw.integrity = { algorithm: 'MD5', payloadHex: 'a'.repeat(64) };
  await expect(validateCaseFile(canonicalJson(raw))).rejects.toThrow('schema');
});
it('rejects unknown future envelope and child versions rather than downgrading', async () => {
  const raw = await file();
  raw.saveVersion = 99;
  await expect(validateCaseFile(await signed(raw))).rejects.toThrow('future');
  const child = await file();
  child.notes = [{ saveVersion: 2 }];
  await expect(validateCaseFile(await signed(child))).rejects.toThrow('future');
});
it('validates real schema: required fields, counts, dates, SQL/note limits and versions', async () => {
  const mutate: ((value: Record<string, unknown>) => void)[] = [
    (v) => {
      delete v.attempts;
    },
    (v) => {
      v.extra = true;
    },
    (v) => {
      v.saveVersion = 0;
    },
    (v) => {
      v.exportedAt = '2026-02-30T00:00:00.000Z';
    },
    (v) => {
      v.campaigns = Array.from(
        { length: 9 },
        () => caseCollections().campaigns[0],
      );
    },
    (v) => {
      v.missionStates = [
        { ...caseCollections().missionStates[0], lastDraft: 'x'.repeat(12001) },
      ];
    },
    (v) => {
      v.notes = [{ ...caseCollections().notes[0], text: 'x'.repeat(8001) }];
    },
    (v) => {
      v.evidence = [
        { ...caseCollections().evidence[0], queryHash: 'not-a-hash' },
      ];
    },
  ];
  for (const change of mutate) {
    const raw = await file();
    change(raw);
    await expect(validateCaseFile(await signed(raw))).rejects.toThrow();
  }
});
it('rejects duplicate primary keys and dangling campaign references, including nested ones', async () => {
  for (const change of [
    (v: Record<string, unknown>) => {
      v.notes = [...caseCollections().notes, ...caseCollections().notes];
    },
    (v: Record<string, unknown>) => {
      v.notes = [{ ...caseCollections().notes[0], campaignId: 'missing' }];
    },
    (v: Record<string, unknown>) => {
      v.notes = [
        { ...caseCollections().notes[0], link: { campaignId: 'missing' } },
      ];
    },
  ]) {
    const raw = await file();
    change(raw);
    await expect(validateCaseFile(await signed(raw))).rejects.toThrow(
      'references',
    );
  }
});
it('bounds depth/nodes and rejects numbers already rounded by JSON parsing', async () => {
  let text = '0';
  for (let i = 0; i < 34; i++) text = '[' + text + ']';
  await expect(validateCaseFile(text)).rejects.toThrow('complexity');
  await expect(validateCaseFile('{"v":9007199254740993}')).rejects.toThrow(
    'schema',
  );
  await expect(validateCaseFile('{"v":1e999}')).rejects.toThrow('schema');
});
