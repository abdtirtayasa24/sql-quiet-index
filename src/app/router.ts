export type Route =
  | { kind: 'home' | 'casebook' | 'practice' | 'settings' | 'not-found' }
  | { kind: 'act'; actId: string }
  | { kind: 'mission'; missionId: string };
export function parseHash(hash: string): Route {
  if (hash === '' || hash === '#/home') return { kind: 'home' };
  if (hash.length > 128) return { kind: 'not-found' };
  const simple = /^#\/(casebook|practice|settings)$/.exec(hash)?.[1];
  if (simple === 'casebook' || simple === 'practice' || simple === 'settings')
    return { kind: simple };
  const actId = /^#\/act\/(0[1-9]|10)$/.exec(hash)?.[1];
  if (actId) return { kind: 'act', actId };
  const missionId = /^#\/mission\/(00[1-9]|0[1-7][0-9]|080)$/.exec(hash)?.[1];
  return missionId ? { kind: 'mission', missionId } : { kind: 'not-found' };
}
export function routeHash(route: Route): string {
  if (route.kind === 'act') return `#/act/${route.actId}`;
  if (route.kind === 'mission') return `#/mission/${route.missionId}`;
  return route.kind === 'not-found' ? '#/not-found' : `#/${route.kind}`;
}
