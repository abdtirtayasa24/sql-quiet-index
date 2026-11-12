import { expect, it } from 'vitest';
import { parseHash, routeHash } from '../../src/app/router';
import { AppStore } from '../../src/app/app-store';
import { missionAccess } from '../../src/app/selectors';
import type { EngineResponse } from '../../src/engine/protocol';
import { caseCollections } from '../fixtures/save-file';
it('parses the six bounded static hash routes and rejects malformed or injected paths', () => {
  for (const hash of [
    '#/home',
    '#/act/03',
    '#/mission/021',
    '#/casebook',
    '#/practice',
    '#/settings',
  ])
    expect(routeHash(parseHash(hash))).toBe(hash);
  for (const hash of [
    '#/mission/000',
    '#/mission/081',
    '#/act/00',
    '#/act/11',
    '#/mission/021/extra',
    '#/mission/%30%32%31',
    'javascript:alert(1)',
    '#/' + 'x'.repeat(1000),
  ])
    expect(parseHash(hash).kind).toBe('not-found');
  expect(parseHash('')).toEqual({ kind: 'home' });
});
it('does not unlock unpublished missions from imported solved IDs and explains locked prerequisites', () => {
  const campaign = caseCollections().campaigns[0];
  expect(missionAccess('021', campaign, new Set())).toBe('unpublished');
  expect(missionAccess('021', campaign, new Set(['021']))).toBe('locked');
  expect(missionAccess('001', campaign, new Set(['001']))).toBe('open');
});
it('publishes immutable detached snapshots, explicit boot/unsupported/storage states and focus destinations', () => {
  const app = new AppStore(() => {});
  expect(app.view.phase).toBe('booting');
  expect(app.view.focusId).toBe('route-status');
  const source = caseCollections();
  app.dispatch({ type: 'RECORDS', records: source });
  const previous = app.view;
  source.campaigns[0]!.completedMissionIds.push('080');
  expect(app.view).toMatchObject({
    phase: 'ready',
    campaigns: [{ completedMissionIds: ['001'] }],
  });
  expect(Object.isFrozen(app.view)).toBe(true);
  if (app.view.phase === 'ready')
    expect(Object.isFrozen(app.view.campaigns[0]?.completedMissionIds)).toBe(
      true,
    );
  app.dispatch({ type: 'NAVIGATE', route: parseHash('#/settings') });
  expect(previous.route.kind).toBe('home');
  app.dispatch({ type: 'UNSUPPORTED', features: ['Worker'] });
  expect(app.view).toMatchObject({
    phase: 'unsupported',
    focusId: 'route-heading',
  });
  app.dispatch({ type: 'STORAGE_ERROR', code: 'unavailable' });
  expect(app.view).toMatchObject({
    phase: 'storage-error',
    focusId: 'route-heading',
  });
});
it('navigation cancels the engine port and rejects late SQL replies even after returning to the same route', async () => {
  let resolve: ((reply: EngineResponse) => void) | undefined;
  let cancelled = 0;
  const app = new AppStore(
    () => {},
    () => ({
      send: () =>
        new Promise((r) => {
          resolve = r;
        }),
      dispose: () => {
        cancelled++;
      },
    }),
    new Set(['001']),
  );
  app.dispatch({ type: 'RECORDS', records: caseCollections() });
  app.dispatch({ type: 'NAVIGATE', route: parseHash('#/mission/001') });
  const work = app.run({ type: 'PROBE' });
  expect(app.view).toMatchObject({ busy: true });
  app.dispatch({ type: 'NAVIGATE', route: parseHash('#/casebook') });
  app.dispatch({ type: 'NAVIGATE', route: parseHash('#/mission/001') });
  resolve?.({
    type: 'PROBE_RESULT',
    sessionId: 'old',
    requestId: 1,
    results: [],
  });
  await work;
  expect(cancelled).toBe(1);
  expect(app.view).toMatchObject({ phase: 'ready', busy: false, result: null });
});
it('an old failed request cannot replace navigation/unsupported state, and disposal cancels pending work', async () => {
  let reject: ((error: Error) => void) | undefined;
  let disposed = 0;
  const app = new AppStore(
    () => {},
    () => ({
      send: () =>
        new Promise((_, r) => {
          reject = r;
        }),
      dispose: () => {
        disposed++;
      },
    }),
    new Set(['001']),
  );
  app.dispatch({ type: 'RECORDS', records: caseCollections() });
  app.dispatch({ type: 'NAVIGATE', route: parseHash('#/mission/001') });
  const work = app.run({ type: 'PROBE' });
  app.dispatch({ type: 'UNSUPPORTED', features: ['WebAssembly'] });
  reject?.(new Error('late private error'));
  await work;
  expect(app.view.phase).toBe('unsupported');
  expect(disposed).toBe(1);
  app.dispose();
});
