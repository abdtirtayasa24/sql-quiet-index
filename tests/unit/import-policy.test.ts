import { expect, it } from 'vitest';
import {
  copyCollections,
  mergeCollections,
} from '../../src/storage/import-policy';
import { caseCollections } from '../fixtures/save-file';
import { canonicalJson } from '../../src/storage/export-import';
it('copies all campaign references, but not SQL, notes, stable evidence/event IDs or database row IDs', () => {
  const source = caseCollections();
  const original = structuredClone(source);
  source.notes[0]!.text = 'c-test is text, not an ID reference';
  const result = copyCollections(source, new Map([['c-test', 'c-copy']]));
  expect(result.campaigns[0]?.campaignId).toBe('c-copy');
  expect(result.campaigns[0]?.seed).toBe(original.campaigns[0]?.seed);
  expect(result.notes[0]).toMatchObject({
    campaignId: 'c-copy',
    text: 'c-test is text, not an ID reference',
    evidenceRefs: [{ campaignId: 'c-copy', evidenceId: 'e-1' }],
  });
  expect(result.evidence[0]).toMatchObject({
    evidenceId: 'e-1',
    selectedRecordRefs: [{ pk: '9007199254740993' }],
    provenance: { campaignId: 'c-copy' },
  });
  expect(source.campaigns[0]?.campaignId).toBe('c-test');
});
it('copies cross-campaign references consistently and rejects incomplete/colliding identity maps', () => {
  const source = caseCollections();
  const second = caseCollections('c-second');
  source.campaigns.push(...second.campaigns);
  source.notes[0]!.sourceCampaignId = 'c-second';
  const copied = copyCollections(
    source,
    new Map([
      ['c-test', 'c-copy'],
      ['c-second', 'c-other'],
    ]),
  );
  expect(copied.notes[0]?.sourceCampaignId).toBe('c-other');
  expect(() =>
    copyCollections(source, new Map([['c-test', 'c-copy']])),
  ).toThrow('references');
  expect(() =>
    copyCollections(
      source,
      new Map([
        ['c-test', 'c-copy'],
        ['c-second', 'c-copy'],
      ]),
    ),
  ).toThrow('references');
});
it('unions solved IDs, dedupes append-only IDs and keeps local notes/choices with explicit conflicts', () => {
  const local = caseCollections();
  const input = caseCollections();
  input.campaigns[0]!.completedMissionIds = ['002'];
  input.notes[0]!.text = 'incoming conflicting note';
  input.verdicts[0]!.choice = 'publish';
  input.conceptEvents.push({ ...input.conceptEvents[0]!, eventId: 'event-2' });
  const before = canonicalJson(local);
  const result = mergeCollections(local, input);
  expect(result.collections.campaigns[0]?.completedMissionIds).toEqual([
    '001',
    '002',
  ]);
  expect(result.collections.notes[0]?.text).toBe(local.notes[0]?.text);
  expect(result.collections.verdicts[0]?.choice).toBe('protect');
  expect(result.collections.evidence).toHaveLength(1);
  expect(result.collections.conceptEvents).toHaveLength(2);
  expect(result.conflicts).toEqual(
    expect.arrayContaining(['notes:c-test:n-1', 'verdicts:c-test:act01']),
  );
  expect(canonicalJson(local)).toBe(before);
});
it('uses timestamp/tab/revision for drafts without demoting solved/hints or navigating active mission', () => {
  const local = caseCollections();
  const input = caseCollections();
  input.missionStates[0]!.lastDraft = 'newest';
  input.missionStates[0]!.status = 'in_progress';
  input.missionStates[0]!.hintMaxSeen = 0;
  input.missionStates[0]!.draftStamp.tabId = 'z';
  input.campaigns[0]!.activeMissionId = '020';
  const next = mergeCollections(local, input).collections;
  expect(next.missionStates[0]).toMatchObject({
    lastDraft: 'newest',
    status: 'solved',
    hintMaxSeen: 2,
  });
  expect(next.campaigns[0]?.activeMissionId).toBe('001');
  input.missionStates[0]!.draftStamp.tabId = 'a';
  const conflict = mergeCollections(local, input);
  expect(conflict.collections.missionStates[0]?.lastDraft).toBe('SELECT café;');
  expect(conflict.conflicts).toContain('missionStates:c-test:001');
});
it('reports divergent non-draft fields and additive campaign choices rather than silently ignoring them', () => {
  const local = caseCollections();
  const incoming = caseCollections();
  incoming.missionStates[0]!.acceptedQueryHash = 'b'.repeat(64);
  Reflect.set(local.campaigns[0]!, 'x_choice', 'keep-local');
  Reflect.set(incoming.campaigns[0]!, 'x_choice', 'keep-incoming');
  const result = mergeCollections(local, incoming);
  expect(result.collections.missionStates[0]?.acceptedQueryHash).toBe(
    'a'.repeat(64),
  );
  expect(result.conflicts).toContain('missionStates:c-test:001');
  expect(result.conflicts).toContain('campaigns:c-test');
});
it('rejects conflicting campaign seed/content/engine identity rather than reattaching provenance', () => {
  for (const field of ['seed', 'contentVersion', 'engineVersion'] as const) {
    const input = caseCollections();
    input.campaigns[0]![field] = 'different';
    expect(() => mergeCollections(caseCollections(), input)).toThrow(
      'identity',
    );
  }
});
