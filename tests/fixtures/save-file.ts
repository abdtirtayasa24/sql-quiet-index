import { newCampaign } from '../../src/storage/schema';
import type { CaseCollections } from '../../src/types/case-file';
export function caseCollections(campaignId = 'c-test'): CaseCollections {
  const now = '2026-11-01T00:00:00.000Z';
  const common = { campaignId, saveVersion: 1 };
  return {
    campaigns: [
      {
        ...newCampaign('en'),
        campaignId,
        createdAt: now,
        updatedAt: now,
        completedMissionIds: ['001'],
        seed: '0123456789abcdef',
      },
    ],
    missionStates: [
      {
        ...common,
        missionId: '001',
        status: 'solved',
        seedVariant: 0,
        lastDraft: 'SELECT café;',
        draftStamp: { updatedAt: now, tabId: 'tab-1', revision: 1 },
        lastRunAt: now,
        hintMaxSeen: 2,
        bestOutcome: 'verified',
        acceptedQueryHash: 'a'.repeat(64),
        firstSolvedAt: now,
      },
    ],
    attempts: [
      {
        ...common,
        attemptId: 'try-1',
        missionId: '001',
        timestamp: now,
        queryText: 'SELECT café;',
      },
    ],
    evidence: [
      {
        ...common,
        evidenceId: 'e-1',
        actId: 'act01',
        missionId: '001',
        nodeId: 'a1.record',
        seedVariant: 0,
        queryText: 'SELECT café;',
        queryHash: 'a'.repeat(64),
        rowKeys: ['[20,"bigint:9007199254740993"]'],
        selectedRecordRefs: [
          { table: 'incident_reports', pk: '9007199254740993' },
        ],
        filedAt: now,
        contentVersion: 'cp1a-storage-1',
        provenance: {
          campaignId,
          evidenceId: 'e-1',
          numeric: '12345678901234567890.123',
        },
      },
    ],
    notes: [
      {
        ...common,
        noteId: 'n-1',
        actId: 'act01',
        text: '<script>private 🌧️ 記録</script>',
        updatedAt: now,
        evidenceRefs: [{ campaignId, evidenceId: 'e-1' }],
      },
    ],
    conceptEvents: [
      {
        ...common,
        eventId: 'event-1',
        conceptId: 'projection',
        itemId: '001-main',
        correct: true,
      },
    ],
    verdicts: [
      {
        ...common,
        actId: 'act01',
        choice: 'protect',
        updatedAt: now,
        proof: { campaignId, evidenceId: 'e-1' },
      },
    ],
  };
}
