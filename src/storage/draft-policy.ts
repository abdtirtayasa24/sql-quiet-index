import type { DraftStamp } from '../types/save';
export function compareDrafts(a: DraftStamp, b: DraftStamp): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? -1 : 1;
  if (a.tabId !== b.tabId) return a.tabId < b.tabId ? -1 : 1;
  return a.revision - b.revision;
}
