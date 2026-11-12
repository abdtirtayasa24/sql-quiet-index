import type { AppCommand, AppSnapshot } from '../types/events';
import type { Campaign } from '../types/save';
import { isCampaign, isObject } from '../types/save';
import type { EngineCommand } from '../engine/protocol';
import type { EngineClient } from '../engine/engine-client';
import { freezeSnapshot, missionAccess } from './selectors';
import type { Route } from './router';
export class AppStore {
  private current: AppSnapshot = freezeSnapshot({
    phase: 'booting',
    route: { kind: 'home' },
    focusId: 'route-status',
  });
  private client: Pick<EngineClient, 'send' | 'dispose'> | undefined;
  private work = 0;
  private disposed = false;
  constructor(
    private readonly changed: () => void,
    private readonly acquire?: () => Pick<EngineClient, 'send' | 'dispose'>,
    private readonly published: ReadonlySet<string> = new Set(),
  ) {}
  get view(): AppSnapshot {
    return this.current;
  }
  private publish(value: AppSnapshot) {
    if (!this.disposed) {
      this.current = freezeSnapshot(value);
      this.changed();
    }
  }
  private cancel() {
    this.work++;
    this.client?.dispose();
    this.client = undefined;
  }
  dispatch(command: AppCommand) {
    if (this.disposed) return;
    if (command.type === 'NAVIGATE') {
      this.cancel();
      const route: Route = structuredClone(command.route);
      const current = this.current;
      this.publish(
        current.phase === 'ready'
          ? {
              ...current,
              route,
              focusId: 'route-heading',
              busy: false,
              result: null,
              requestError: null,
              access:
                route.kind === 'mission'
                  ? missionAccess(
                      route.missionId,
                      current.campaigns[0],
                      this.published,
                    )
                  : null,
            }
          : { ...current, route },
      );
    } else if (command.type === 'UNSUPPORTED') {
      this.cancel();
      this.publish({
        phase: 'unsupported',
        route: this.current.route,
        focusId: 'route-heading',
        reason: command.reason ?? 'capabilities',
        features: [...command.features],
      });
    } else if (command.type === 'STORAGE_ERROR') {
      this.cancel();
      this.publish({
        phase: 'storage-error',
        route: this.current.route,
        focusId: 'route-heading',
        code: command.code,
      });
    } else {
      this.cancel();
      if (
        Object.values(command.records).some((rows) =>
          rows.some(
            (row) =>
              isObject(row) &&
              typeof row.saveVersion === 'number' &&
              row.saveVersion > 1,
          ),
        )
      ) {
        this.publish({
          phase: 'unsupported',
          route: this.current.route,
          focusId: 'route-heading',
          reason: 'save-version',
          features: [],
        });
        return;
      }
      const campaigns = command.records.campaigns ?? [];
      if (!campaigns.every(isCampaign)) {
        this.dispatch({ type: 'STORAGE_ERROR', code: 'corrupt' });
        return;
      }
      const copy: Campaign[] = structuredClone(campaigns);
      const route = this.current.route;
      this.publish({
        phase: 'ready',
        route,
        focusId: 'route-heading',
        campaigns: copy,
        counts: Object.fromEntries(
          Object.entries(command.records).map(([key, rows]) => [
            key,
            rows.length,
          ]),
        ),
        access:
          route.kind === 'mission'
            ? missionAccess(route.missionId, copy[0], this.published)
            : null,
        busy: false,
        result: null,
        requestError: null,
      });
    }
  }
  async run(command: EngineCommand) {
    if (
      this.disposed ||
      !this.acquire ||
      this.current.phase !== 'ready' ||
      this.current.access !== 'open' ||
      this.current.busy
    )
      return;
    const work = ++this.work;
    try {
      const client = (this.client ??= this.acquire());
      this.publish({
        ...this.current,
        busy: true,
        result: null,
        requestError: null,
      });
      const result = await client.send(command);
      if (work === this.work && this.current.phase === 'ready')
        this.publish({
          ...this.current,
          busy: false,
          result: freezeSnapshot(structuredClone(result)),
        });
    } catch {
      if (work === this.work && this.current.phase === 'ready')
        this.publish({
          ...this.current,
          busy: false,
          requestError: 'engine-unavailable',
        });
    }
  }
  dispose() {
    this.cancel();
    this.disposed = true;
  }
}
