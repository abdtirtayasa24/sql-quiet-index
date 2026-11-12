export function missionAccess(
  id: string,
  campaign: { readonly completedMissionIds: readonly string[] } | undefined,
  published: ReadonlySet<string>,
): 'open' | 'locked' | 'unpublished' {
  if (!published.has(id)) return 'unpublished';
  if (!campaign) return 'locked';
  // No fabricated story unlock graph: only entry/replay is known at this checkpoint.
  return id === '001' || campaign.completedMissionIds.includes(id)
    ? 'open'
    : 'locked';
}
export function freezeSnapshot<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) freezeSnapshot(item);
    Object.freeze(value);
  }
  return value;
}
