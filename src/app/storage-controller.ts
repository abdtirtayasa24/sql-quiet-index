import { isCampaign, isObject, StorageFailure } from '../types/save';
import type { Campaign, Collections, StorageCode } from '../types/save';
import { LocalStore } from '../storage/local';
import type { Settings } from '../storage/local';
import { openProgress } from '../storage/progress-db';
import type { ProgressDb } from '../storage/progress-db';
import { newCampaign } from '../storage/schema';
import { DraftController } from './draft-controller';
export type ProgressPort = Pick<
  ProgressDb,
  'create' | 'snapshot' | 'saveDraft' | 'close' | 'futureSchema'
>;
export class StorageController {
  phase: 'loading' | 'empty' | 'ready' | 'recovery' = 'loading';
  issue: StorageCode | undefined;
  campaign: Campaign | undefined;
  draft: DraftController | undefined;
  settings: Settings;
  settingsSaved = true;
  pointerSaved = true;
  private records: Collections = {};
  private repo: ProgressPort | undefined;
  private disposed = false;
  private starting = false;
  constructor(
    private readonly changed: () => void,
    private readonly local = new LocalStore(),
    private readonly open: (
      notice: (code: StorageCode) => void,
    ) => Promise<ProgressPort> = openProgress,
  ) {
    this.settings = local.settings();
  }
  get view() {
    return {
      phase: this.phase,
      issue: this.issue ?? this.draft?.error,
      campaignId: this.campaign?.campaignId,
      seed: this.campaign?.seed,
      sql: this.draft?.text ?? '',
      draftStatus: this.draft?.status ?? 'clean',
      settings: { ...this.settings },
      settingsSaved: this.settingsSaved,
      pointerSaved: this.pointerSaved,
    };
  }
  async start() {
    if (this.starting || this.disposed) return;
    this.starting = true;
    await this.draft?.flush();
    const pending =
      this.draft &&
      this.draft.status !== 'saved' &&
      this.draft.status !== 'clean'
        ? this.draft.text
        : undefined;
    this.draft?.dispose();
    this.repo?.close();
    this.phase = 'loading';
    this.issue = undefined;
    this.changed();
    try {
      this.repo = await this.open((code) => {
        this.issue = code;
        this.phase = 'recovery';
        this.changed();
      });
      if (this.disposed) {
        this.repo.close();
        return;
      }
      this.records = await this.repo.snapshot();
      if (
        this.repo.futureSchema ||
        Object.values(this.records).some((rows) =>
          rows.some(
            (row) =>
              isObject(row) &&
              typeof row.saveVersion === 'number' &&
              row.saveVersion > 1,
          ),
        )
      )
        throw new StorageFailure('future');
      const campaigns = this.records.campaigns ?? [];
      if (!campaigns.every(isCampaign)) throw new StorageFailure('corrupt');
      const pointer = this.local.pointer();
      if (pointer.kind === 'invalid') throw new StorageFailure('corrupt');
      const selected =
        pointer.kind === 'present'
          ? campaigns.find((row) => row.campaignId === pointer.value.campaignId)
          : [...campaigns].sort((a, b) =>
              a.updatedAt < b.updatedAt
                ? 1
                : a.updatedAt > b.updatedAt
                  ? -1
                  : a.campaignId.localeCompare(b.campaignId),
            )[0];
      if (!selected && pointer.kind === 'present')
        throw new StorageFailure('missing');
      if (!selected) {
        this.campaign = undefined;
        this.draft = undefined;
        this.phase = 'empty';
        return;
      }
      this.attach(selected);
      if (pending !== undefined) this.draft?.edit(pending);
    } catch (error) {
      this.phase = 'recovery';
      this.issue = error instanceof StorageFailure ? error.code : 'unavailable';
    } finally {
      this.starting = false;
      if (!this.disposed) this.changed();
    }
  }
  private attach(campaign: Campaign) {
    const mission = this.records.missionStates?.find(
      (row) =>
        isObject(row) &&
        row.campaignId === campaign.campaignId &&
        row.missionId === campaign.activeMissionId,
    );
    if (
      mission !== undefined &&
      (!isObject(mission) || typeof mission.lastDraft !== 'string')
    )
      throw new StorageFailure('corrupt');
    this.campaign = campaign;
    this.phase = 'ready';
    this.draft = new DraftController(
      async (text, stamp) => {
        if (!this.repo) throw new StorageFailure('unavailable');
        const result = await this.repo.saveDraft(
          campaign.campaignId,
          campaign.activeMissionId,
          text,
          stamp,
        );
        this.records = await this.repo.snapshot();
        this.pointerSaved = this.local.savePointer({
          campaignId: campaign.campaignId,
          updatedAt: new Date().toISOString(),
        });
        return result;
      },
      this.changed,
      crypto.randomUUID(),
      isObject(mission) && typeof mission.lastDraft === 'string'
        ? mission.lastDraft
        : '',
    );
  }
  async create() {
    if (this.phase !== 'empty' || !this.repo) return;
    this.phase = 'loading';
    this.changed();
    try {
      const campaign = await this.repo.create(
        newCampaign(this.settings.locale),
      );
      this.records = await this.repo.snapshot();
      this.pointerSaved = this.local.savePointer({
        campaignId: campaign.campaignId,
        updatedAt: campaign.updatedAt,
      });
      this.attach(campaign);
    } catch (error) {
      this.issue = error instanceof StorageFailure ? error.code : 'unavailable';
      this.phase = 'recovery';
    }
    this.changed();
  }
  setSettings(settings: Settings) {
    this.settings = settings;
    this.settingsSaved = this.local.saveSettings(settings);
    this.changed();
  }
  async recovery(): Promise<string> {
    try {
      if (this.repo) this.records = await this.repo.snapshot();
    } catch {
      /* Keep last readable records and pending text. */
    }
    return JSON.stringify(
      {
        format: 'the-quiet-index-recovery',
        exportedAt: new Date().toISOString(),
        records: this.records,
        unsavedDraft: this.draft
          ? {
              campaignId: this.campaign?.campaignId,
              missionId: this.campaign?.activeMissionId,
              text: this.draft.text,
              state: this.draft.status,
            }
          : null,
      },
      null,
      2,
    );
  }
  dispose() {
    this.disposed = true;
    this.draft?.dispose();
    this.repo?.close();
  }
}
