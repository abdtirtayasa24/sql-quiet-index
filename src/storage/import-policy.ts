import type { CaseCollections } from '../types/case-file';
import { ImportFailure } from '../types/case-file';
import { isObject } from '../types/save';
import type { MissionState } from '../types/save';
import { canonicalJson } from './export-import';
import { compareDrafts } from './draft-policy';

export function copyCollections(
  source: CaseCollections,
  identities: ReadonlyMap<string, string>,
): CaseCollections {
  if (
    identities.size !== source.campaigns.length ||
    new Set(identities.values()).size !== identities.size ||
    source.campaigns.some((c) => !identities.has(c.campaignId))
  )
    throw new ImportFailure('references');
  const rewrite = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rewrite);
    if (!isObject(value)) return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => {
        if (
          (key === 'campaignId' || key.endsWith('CampaignId')) &&
          child !== null
        ) {
          const next =
            typeof child === 'string' ? identities.get(child) : undefined;
          if (!next) throw new ImportFailure('references');
          return [key, next];
        }
        return [key, rewrite(child)];
      }),
    );
  };
  return rewrite(source) as CaseCollections;
}
export function mergeCollections(
  local: CaseCollections,
  incoming: CaseCollections,
): { collections: CaseCollections; conflicts: string[] } {
  const result = structuredClone(local);
  const input = structuredClone(incoming);
  const conflicts: string[] = [];
  const mergeRows = <T>(
    target: T[],
    source: T[],
    key: (row: T) => string,
    combine: (old: T, next: T, id: string) => T,
  ) => {
    const positions = new Map(target.map((row, index) => [key(row), index]));
    for (const next of source) {
      const id = key(next);
      const index = positions.get(id);
      if (index === undefined) {
        positions.set(id, target.length);
        target.push(next);
      } else {
        const old = target[index];
        if (old !== undefined) target[index] = combine(old, next, id);
      }
    }
  };
  mergeRows(
    result.campaigns,
    input.campaigns,
    (row) => row.campaignId,
    (old, next, id) => {
      if (
        old.seed !== next.seed ||
        old.engineVersion !== next.engineVersion ||
        old.contentVersion !== next.contentVersion
      )
        throw new ImportFailure('identity');
      if (canonicalJson(old) !== canonicalJson(next))
        conflicts.push(`campaigns:${id}`);
      return {
        ...next,
        ...old,
        completedMissionIds: [
          ...new Set([...old.completedMissionIds, ...next.completedMissionIds]),
        ].sort(),
        updatedAt:
          old.updatedAt > next.updatedAt ? old.updatedAt : next.updatedAt,
        endingId: old.endingId ?? next.endingId,
      };
    },
  );
  mergeRows<MissionState>(
    result.missionStates,
    input.missionStates,
    (row) => JSON.stringify([row.campaignId, row.missionId]),
    (old, next) => {
      const latest =
        compareDrafts(next.draftStamp, old.draftStamp) > 0 ? next : old;
      if (canonicalJson(old) !== canonicalJson(next))
        conflicts.push(`missionStates:${old.campaignId}:${old.missionId}`);
      return {
        ...next,
        ...old,
        lastDraft: latest.lastDraft,
        draftStamp: latest.draftStamp,
        status:
          old.status === 'solved' || next.status === 'solved'
            ? 'solved'
            : 'in_progress',
        hintMaxSeen: Math.max(old.hintMaxSeen, next.hintMaxSeen),
        firstSolvedAt:
          [old.firstSolvedAt, next.firstSolvedAt]
            .filter((v): v is string => v !== null)
            .sort()[0] ?? null,
      };
    },
  );
  for (const [name, keyField] of [
    ['attempts', 'attemptId'],
    ['evidence', 'evidenceId'],
    ['notes', 'noteId'],
    ['conceptEvents', 'eventId'],
    ['verdicts', 'actId'],
  ] as const) {
    mergeRows(
      result[name],
      input[name],
      (row) => JSON.stringify([row.campaignId, row[keyField]]),
      (old, next) => {
        if (canonicalJson(old) !== canonicalJson(next))
          conflicts.push(`${name}:${old.campaignId}:${String(old[keyField])}`);
        return old;
      },
    );
  }
  return { collections: result, conflicts };
}
