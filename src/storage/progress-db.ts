import { isCampaign, isObject, StorageFailure } from '../types/save';
import type {
  Campaign,
  Collections,
  DraftStamp,
  MissionState,
  SaveRow,
  StorageCode,
} from '../types/save';
import { compareDrafts } from './draft-policy';
import { campaignStores, DB_NAME, DB_VERSION, schema } from './schema';
import { migrateCollections } from './migrations';
import type { MigrationSteps } from './migrations';
import type { CaseFile, CaseCollections } from '../types/case-file';
import { ImportFailure, MAX_FILE_BYTES } from '../types/case-file';
import { canonicalJson } from './export-import';
import type * as SaveValidator from './import-validator';

function failure(error: unknown): StorageFailure {
  if (error instanceof StorageFailure) return error;
  return new StorageFailure(
    error instanceof DOMException && error.name === 'QuotaExceededError'
      ? 'quota'
      : 'aborted',
  );
}
export class ProgressDb {
  private stopped: StorageCode | undefined;
  private readonly writes = new Set<IDBTransaction>();
  readonly futureSchema: boolean;
  constructor(
    private readonly db: IDBDatabase,
    private readonly notice: (code: StorageCode) => void = () => {},
  ) {
    this.futureSchema = db.version > DB_VERSION;
    db.onversionchange = () => {
      this.stopped = 'versionchange';
      db.close();
      this.notice('versionchange');
    };
    db.onclose = () => {
      if (!this.stopped) {
        this.stopped = 'unavailable';
        this.notice('unavailable');
      }
    };
  }
  close() {
    this.db.close();
    this.stopped ??= 'unavailable';
  }
  private write<T>(
    stores: string[],
    schedule: (
      tx: IDBTransaction,
      set: (value: T) => void,
      fail: (error: unknown) => void,
    ) => void,
  ): Promise<T> {
    if (this.stopped) return Promise.reject(new StorageFailure(this.stopped));
    if (this.futureSchema) return Promise.reject(new StorageFailure('future'));
    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = this.db.transaction(stores, 'readwrite', { durability: 'strict' });
      } catch (error) {
        reject(failure(error));
        return;
      }
      this.writes.add(tx);
      let result: T;
      let reason: StorageFailure | undefined;
      const fail = (error: unknown) => {
        reason = failure(error);
        try {
          tx.abort();
        } catch {
          /* Already aborted; onabort owns rejection. */
        }
      };
      tx.oncomplete = () => {
        this.writes.delete(tx);
        resolve(result);
      };
      tx.onabort = () => {
        this.writes.delete(tx);
        const error =
          reason ??
          (this.stopped ? new StorageFailure(this.stopped) : failure(tx.error));
        this.stopped ??= error.code;
        for (const pending of this.writes) {
          try {
            pending.abort();
          } catch {
            /* A completed transaction cannot be aborted. */
          }
        }
        reject(error);
      };
      try {
        schedule(
          tx,
          (value) => {
            result = value;
          },
          fail,
        );
      } catch (error) {
        fail(error);
      }
    });
  }
  async create(campaign: Campaign): Promise<Campaign> {
    if (!isCampaign(campaign)) throw new StorageFailure('corrupt');
    return this.write(['campaigns', 'meta'], (tx, set) => {
      tx.objectStore('campaigns').add(campaign);
      tx.objectStore('meta').add({
        key: `created:${campaign.campaignId}`,
        campaignId: campaign.campaignId,
        seed: campaign.seed,
      });
      set(structuredClone(campaign));
    });
  }
  private current(
    tx: IDBTransaction,
    campaignId: string,
    apply: (value: Campaign) => void,
    fail: (error: unknown) => void,
  ) {
    const request = tx.objectStore('campaigns').get(campaignId);
    request.onsuccess = () => {
      try {
        const raw: unknown = request.result;
        if (
          isObject(raw) &&
          typeof raw.saveVersion === 'number' &&
          raw.saveVersion > 1
        )
          throw new StorageFailure('future');
        if (!isCampaign(raw))
          throw new StorageFailure(raw === undefined ? 'missing' : 'corrupt');
        apply(raw);
      } catch (error) {
        fail(error);
      }
    };
  }
  saveDraft(
    campaignId: string,
    missionId: string,
    sql: string,
    stamp: DraftStamp,
  ): Promise<{ applied: boolean; draft: string }> {
    if (
      !/^(00[1-9]|0[1-7][0-9]|080)$/.test(missionId) ||
      sql.length > 12000 ||
      !validStamp(stamp)
    )
      return Promise.reject(new StorageFailure('corrupt'));
    return this.write(['campaigns', 'missionStates'], (tx, set, fail) => {
      this.current(
        tx,
        campaignId,
        (campaign) => {
          const request = tx
            .objectStore('missionStates')
            .get([campaignId, missionId]);
          request.onsuccess = () => {
            try {
              const raw: unknown = request.result;
              if (
                isObject(raw) &&
                typeof raw.saveVersion === 'number' &&
                raw.saveVersion > 1
              )
                throw new StorageFailure('future');
              if (raw !== undefined && !isMission(raw))
                throw new StorageFailure('corrupt');
              if (raw && compareDrafts(stamp, raw.draftStamp) <= 0) {
                set({ applied: false, draft: raw.lastDraft });
                return;
              }
              const next: MissionState = {
                ...(raw ?? {
                  campaignId,
                  missionId,
                  saveVersion: 1,
                  status: 'in_progress',
                  seedVariant: 0,
                  lastRunAt: null,
                  hintMaxSeen: 0,
                  bestOutcome: null,
                  acceptedQueryHash: null,
                  firstSolvedAt: null,
                }),
                lastDraft: sql,
                draftStamp: stamp,
              };
              tx.objectStore('missionStates').put(next);
              tx.objectStore('campaigns').put({
                ...campaign,
                updatedAt: later(campaign.updatedAt),
              });
              set({ applied: true, draft: sql });
            } catch (error) {
              fail(error);
            }
          };
        },
        fail,
      );
    });
  }
  mergeProgress(
    campaignId: string,
    solved: readonly string[],
    evidence: readonly SaveRow[],
    events: readonly SaveRow[],
  ): Promise<void> {
    if (
      solved.some((id) => !/^(00[1-9]|0[1-7][0-9]|080)$/.test(id)) ||
      [...evidence, ...events].some(
        (row) => row.campaignId !== campaignId || row.saveVersion !== 1,
      )
    )
      return Promise.reject(new StorageFailure('corrupt'));
    return this.write(
      ['campaigns', 'evidence', 'conceptEvents'],
      (tx, set, fail) => {
        this.current(
          tx,
          campaignId,
          (campaign) => {
            tx.objectStore('campaigns').put({
              ...campaign,
              completedMissionIds: [
                ...new Set([...campaign.completedMissionIds, ...solved]),
              ].sort(),
              updatedAt: later(campaign.updatedAt),
            });
            for (const [name, key, rows] of [
              ['evidence', 'evidenceId', evidence],
              ['conceptEvents', 'eventId', events],
            ] as const) {
              const seen = new Set<string>();
              for (const row of rows) {
                const id = row[key];
                if (typeof id !== 'string' || !id)
                  throw new StorageFailure('corrupt');
                if (seen.has(id)) continue;
                seen.add(id);
                const request = tx.objectStore(name).get([campaignId, id]);
                request.onsuccess = () => {
                  try {
                    if (request.result === undefined)
                      tx.objectStore(name).add(row);
                  } catch (error) {
                    fail(error);
                  }
                };
              }
            }
            set(undefined);
          },
          fail,
        );
      },
    );
  }
  migrateCampaign(
    campaignId: string,
    target: number,
    steps: MigrationSteps,
  ): Promise<void> {
    return this.write(
      [...campaignStores, 'backups', 'meta'],
      (tx, set, fail) => {
        const input: Collections = {};
        let remaining = campaignStores.length;
        for (const store of campaignStores) {
          const request = tx.objectStore(store).getAll();
          request.onsuccess = () => {
            try {
              const rows: unknown = request.result;
              if (!Array.isArray(rows)) throw new StorageFailure('corrupt');
              input[store] = rows.filter(
                (row: unknown) =>
                  isObject(row) && row.campaignId === campaignId,
              );
              if (--remaining !== 0) return;
              const campaign = input.campaigns?.[0];
              if (
                !isObject(campaign) ||
                typeof campaign.saveVersion !== 'number'
              )
                throw new StorageFailure('missing');
              const from = campaign.saveVersion;
              if (from === target) {
                set(undefined);
                return;
              }
              const output = migrateCollections(input, from, target, steps);
              const backupId = `migration-${from}-${target}`;
              tx.objectStore('backups').add({
                campaignId,
                backupId,
                saveVersion: from,
                data: input,
              });
              for (const [name, records] of Object.entries(output))
                for (const row of records) {
                  if (!isObject(row) || row.campaignId !== campaignId)
                    throw new StorageFailure('corrupt');
                  tx.objectStore(name).put(row);
                }
              tx.objectStore('meta').add({
                key: `${campaignId}:${backupId}`,
                campaignId,
                from,
                target,
              });
              set(undefined);
            } catch (error) {
              fail(error);
            }
          };
        }
      },
    );
  }
  async importCaseFile(
    file: CaseFile,
    mode: 'merge' | 'copy',
    confirmed: boolean,
  ): Promise<{ campaignIds: string[]; conflicts: string[] }> {
    if (confirmed !== true) throw new ImportFailure('confirmation');
    if (mode !== 'merge' && mode !== 'copy') throw new ImportFailure('schema');
    const validator: typeof SaveValidator = await import('./import-validator');
    const { copyCollections, mergeCollections } =
      await import('./import-policy');
    // Revalidate and detach before opening any writing transaction.
    const safe = await validator.validateCaseFile(canonicalJson(file));
    const incoming = Object.fromEntries(
      campaignStores.map((name) => [name, safe[name]]),
    ) as CaseCollections;
    const ids = new Map(
      incoming.campaigns.map((row) => [
        row.campaignId,
        `c-${crypto.randomUUID()}`,
      ]),
    );
    const input = mode === 'copy' ? copyCollections(incoming, ids) : incoming;
    type Outcome =
      | { ok: true; campaignIds: string[]; conflicts: string[] }
      | { ok: false; error: ImportFailure };
    const outcome = await this.write<Outcome>(
      [...campaignStores],
      (tx, set, fail) => {
        const local: Collections = {};
        let remaining = campaignStores.length;
        for (const name of campaignStores) {
          const request = tx.objectStore(name).getAll();
          request.onsuccess = () => {
            try {
              const rows: unknown = request.result;
              if (!Array.isArray(rows)) throw new ImportFailure('schema');
              local[name] = rows;
              if (--remaining !== 0) return;
              if (
                mode === 'copy' &&
                local.campaigns?.some(
                  (row) =>
                    isObject(row) &&
                    input.campaigns.some(
                      (next) => next.campaignId === row.campaignId,
                    ),
                )
              )
                throw new ImportFailure('identity');
              const plan = mergeCollections(local as CaseCollections, input);
              const envelope = { ...safe, ...plan.collections };
              validator.checkCaseFile(envelope);
              if (
                new TextEncoder().encode(canonicalJson(envelope)).byteLength >
                MAX_FILE_BYTES
              )
                throw new ImportFailure('capacity');
              // No writes are scheduled until the entire latest-record plan validates.
              for (const store of campaignStores)
                for (const row of plan.collections[store])
                  tx.objectStore(store).put(row);
              set({
                ok: true,
                campaignIds: input.campaigns.map((row) => row.campaignId),
                conflicts: plan.conflicts,
              });
            } catch (error) {
              if (error instanceof ImportFailure) set({ ok: false, error });
              else fail(error);
            }
          };
        }
      },
    );
    if (!outcome.ok) throw outcome.error;
    return { campaignIds: outcome.campaignIds, conflicts: outcome.conflicts };
  }
  snapshot(): Promise<Collections> {
    if (this.db.objectStoreNames.length === 0) return Promise.resolve({});
    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      const result: Collections = {};
      try {
        tx = this.db.transaction([...this.db.objectStoreNames], 'readonly');
      } catch {
        reject(new StorageFailure(this.stopped ?? 'unavailable'));
        return;
      }
      for (const name of [...this.db.objectStoreNames]) {
        const request = tx.objectStore(name).getAll();
        request.onsuccess = () => {
          const rows: unknown = request.result;
          if (Array.isArray(rows)) result[name] = rows;
          else tx.abort();
        };
      }
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure(tx.error));
    });
  }
}

function later(previous: string) {
  const now = new Date().toISOString();
  return previous > now ? previous : now;
}
function validStamp(value: unknown): value is DraftStamp {
  return (
    isObject(value) &&
    typeof value.updatedAt === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.updatedAt) &&
    Number.isFinite(Date.parse(value.updatedAt)) &&
    typeof value.tabId === 'string' &&
    value.tabId.length > 0 &&
    value.tabId.length <= 256 &&
    typeof value.revision === 'number' &&
    Number.isSafeInteger(value.revision) &&
    value.revision >= 0
  );
}
function isMission(value: unknown): value is MissionState {
  return (
    isObject(value) &&
    typeof value.campaignId === 'string' &&
    typeof value.missionId === 'string' &&
    value.saveVersion === 1 &&
    (value.status === 'in_progress' || value.status === 'solved') &&
    typeof value.lastDraft === 'string' &&
    validStamp(value.draftStamp) &&
    typeof value.seedVariant === 'number' &&
    typeof value.hintMaxSeen === 'number' &&
    (value.lastRunAt === null || typeof value.lastRunAt === 'string') &&
    (value.bestOutcome === null || typeof value.bestOutcome === 'string') &&
    (value.acceptedQueryHash === null ||
      typeof value.acceptedQueryHash === 'string') &&
    (value.firstSolvedAt === null || typeof value.firstSolvedAt === 'string')
  );
}

export function openProgress(
  notice: (code: StorageCode) => void = () => {},
  factory: IDBFactory | null = globalThis.indexedDB,
  requestedVersion = DB_VERSION,
): Promise<ProgressDb> {
  return new Promise((resolve, reject) => {
    if (!factory) {
      reject(new StorageFailure('unavailable'));
      return;
    }
    let settled = false;
    const open = (version?: number) => {
      let request: IDBOpenDBRequest;
      try {
        request =
          version === undefined
            ? factory.open(DB_NAME)
            : factory.open(DB_NAME, version);
      } catch {
        reject(new StorageFailure('unavailable'));
        return;
      }
      request.onblocked = () => {
        settled = true;
        notice('blocked');
        reject(new StorageFailure('blocked'));
      };
      request.onupgradeneeded = () => {
        if (settled || version === undefined) {
          request.transaction?.abort();
          return;
        }
        for (const [name, definition] of Object.entries(schema)) {
          if (request.result.objectStoreNames.contains(name)) continue;
          const store = request.result.createObjectStore(name, {
            keyPath: definition.keyPath,
          });
          for (const [index, keyPath] of Object.entries(definition.indexes))
            store.createIndex(index, keyPath);
        }
      };
      request.onerror = () => {
        if (!settled && request.error?.name === 'VersionError') {
          open();
          return;
        }
        reject(new StorageFailure('unavailable'));
      };
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        settled = true;
        const db = request.result;
        if (db.version === DB_VERSION) {
          try {
            for (const [name, definition] of Object.entries(schema)) {
              const store = db.transaction(name).objectStore(name);
              if (
                store.autoIncrement ||
                JSON.stringify(store.keyPath) !==
                  JSON.stringify(definition.keyPath) ||
                store.indexNames.length !==
                  Object.keys(definition.indexes).length
              )
                throw new StorageFailure('corrupt');
              for (const [name, path] of Object.entries(definition.indexes)) {
                const index = store.index(name);
                if (
                  index.unique ||
                  index.multiEntry ||
                  JSON.stringify(index.keyPath) !== JSON.stringify(path)
                )
                  throw new StorageFailure('corrupt');
              }
            }
          } catch {
            db.close();
            reject(new StorageFailure('corrupt'));
            return;
          }
        }
        resolve(new ProgressDb(db, notice));
      };
    };
    open(requestedVersion);
  });
}
