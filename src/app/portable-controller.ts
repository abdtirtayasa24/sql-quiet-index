import { openProgress } from '../storage/progress-db';
import type { ProgressDb } from '../storage/progress-db';
import { exportCaseFile, canonicalJson } from '../storage/export-import';
import { campaignStores } from '../storage/schema';
import { ImportFailure, MAX_FILE_BYTES } from '../types/case-file';
import type { CaseFile, ImportCode } from '../types/case-file';
import { StorageFailure } from '../types/save';
import type { StorageCode } from '../types/save';
export type PortablePort = Pick<
  ProgressDb,
  'snapshot' | 'importCaseFile' | 'close' | 'futureSchema'
>;
export interface ImportSummary {
  campaignIds: string[];
  counts: Record<string, number>;
  solved: number;
}
export type PortableState = (
  | { kind: 'idle' | 'reading' | 'unsupported' }
  | { kind: 'preview' | 'importing'; summary: ImportSummary }
  | { kind: 'done'; campaignIds: string[]; conflicts: string[] }
  | { kind: 'error'; code: ImportCode | StorageCode }
) & { fileName?: string };
export class PortableController {
  private state: PortableState = { kind: 'idle' };
  private input: Blob | undefined;
  private preserved: Blob | undefined;
  private file: CaseFile | undefined;
  private repo: Promise<PortablePort> | undefined;
  private epoch = 0;
  private disposed = false;
  constructor(
    private readonly changed: () => void,
    private readonly open: () => Promise<PortablePort> = openProgress,
  ) {}
  get view(): PortableState {
    const view = structuredClone(this.state);
    return typeof File !== 'undefined' && this.input instanceof File
      ? { ...view, fileName: this.input.name.slice(0, 256) }
      : view;
  }
  get hasOriginal() {
    return this.input !== undefined;
  }
  private async connection() {
    if (this.disposed) throw new StorageFailure('unavailable');
    const pending = (this.repo ??= this.open());
    const repo = await pending;
    if (this.disposed || this.repo !== pending) {
      repo.close();
      throw new StorageFailure('unavailable');
    }
    return repo;
  }
  report(error: unknown) {
    this.state = {
      kind: 'error',
      code:
        error instanceof ImportFailure || error instanceof StorageFailure
          ? error.code
          : 'unavailable',
    };
    this.changed();
  }
  async select(input: Blob) {
    if (this.disposed || this.state.kind === 'importing') return;
    const epoch = ++this.epoch;
    this.input = input;
    this.preserved = undefined;
    this.file = undefined;
    this.state = { kind: 'reading' };
    this.changed();
    try {
      if (input.size > MAX_FILE_BYTES) throw new ImportFailure('size');
      const bytes = await input.arrayBuffer();
      if (epoch !== this.epoch) return;
      this.preserved = new Blob([bytes], { type: 'application/octet-stream' });
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        throw new ImportFailure('json');
      }
      const { validateCaseFile } = await import('../storage/import-validator');
      const file = await validateCaseFile(text);
      if (epoch !== this.epoch) return;
      this.file = file;
      this.state = {
        kind: 'preview',
        summary: {
          campaignIds: file.campaigns.map((c) => c.campaignId),
          counts: Object.fromEntries(
            campaignStores.map((name) => [name, file[name].length]),
          ),
          solved: file.campaigns.reduce(
            (sum, c) => sum + c.completedMissionIds.length,
            0,
          ),
        },
      };
    } catch (error) {
      if (epoch !== this.epoch) return;
      if (error instanceof ImportFailure && error.code === 'future')
        this.state = { kind: 'unsupported' };
      else
        this.state = {
          kind: 'error',
          code: error instanceof ImportFailure ? error.code : 'json',
        };
    }
    if (!this.disposed) this.changed();
  }
  async confirm(mode: 'merge' | 'copy', confirmed: boolean) {
    if (this.disposed || this.state.kind !== 'preview' || !this.file) return;
    if (!confirmed) {
      this.report(new ImportFailure('confirmation'));
      return;
    }
    const file = this.file;
    const epoch = this.epoch;
    this.state = { kind: 'importing', summary: this.state.summary };
    this.changed();
    try {
      const repo = await this.connection();
      const result = await repo.importCaseFile(file, mode, true);
      if (!this.disposed && epoch === this.epoch)
        this.state = { kind: 'done', ...result };
    } catch (error) {
      if (!this.disposed && epoch === this.epoch) this.report(error);
    }
    if (!this.disposed) this.changed();
  }
  original(): Blob | undefined {
    return (
      this.preserved ??
      (this.input
        ? new Blob([this.input], { type: 'application/octet-stream' })
        : undefined)
    );
  }
  async exportLocal(): Promise<Blob> {
    const repo = await this.connection();
    if (repo.futureSchema) throw new ImportFailure('future');
    const text = await exportCaseFile(await repo.snapshot());
    const { validateCaseFile } = await import('../storage/import-validator');
    await validateCaseFile(text);
    return new Blob([text], { type: 'application/json' });
  }
  async recoveryLocal(): Promise<Blob> {
    const records = await (await this.connection()).snapshot();
    return new Blob(
      [canonicalJson({ format: 'the-quiet-index-recovery', records })],
      { type: 'application/json' },
    );
  }
  suspend() {
    const previous = this.repo;
    this.repo = undefined;
    void previous?.then(
      (repo) => repo.close(),
      () => {
        /* Failed opens own no connection to close. */
      },
    );
  }
  dispose() {
    this.disposed = true;
    this.epoch++;
    this.suspend();
  }
}
