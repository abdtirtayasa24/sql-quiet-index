import { StorageController } from './storage-controller';
import { WorkspaceClient } from '../engine/workspace-client';
import type {
  WorkspaceCommand,
  WorkspaceReply,
  PracticeResult,
} from '../engine/workspace-protocol';
import { queryFeedback } from '../engine/workspace-feedback';
import type { QueryFeedback } from '../engine/workspace-feedback';
interface EnginePort {
  send(command: WorkspaceCommand): Promise<WorkspaceReply>;
  reset(): void;
  dispose(): void;
}
export class WorkspaceController {
  readonly storage: StorageController;
  private phase:
    'loading' | 'ready' | 'running' | 'recovering' | 'recovery' | 'stopped' =
    'loading';
  private result: PracticeResult | undefined;
  private feedback: QueryFeedback | undefined;
  private message = 'Opening local practice file…';
  private queries: string[] = [];
  private oversizedDraft: string | undefined;
  private runCount = 0;
  private generation = 0;
  private disposed = false;
  constructor(
    private readonly changed: () => void,
    storage?: StorageController,
    private readonly engine: EnginePort = new WorkspaceClient(),
  ) {
    this.storage =
      storage ??
      new StorageController(() => {
        if (this.storage.phase === 'recovery') this.cancel();
        this.changed();
      });
  }
  get view() {
    return Object.freeze({
      phase: this.phase,
      result: this.result,
      feedback: this.feedback,
      message: this.message,
      queries: Object.freeze([...this.queries]),
      storage: this.storage.view,
      unsavedDraft: this.oversizedDraft !== undefined,
      canRun:
        this.oversizedDraft === undefined &&
        this.phase === 'ready' &&
        this.storage.phase === 'ready' &&
        this.storage.draft?.status !== 'paused',
    });
  }
  async start() {
    await this.storage.start();
    if (!this.disposed && this.storage.phase === 'ready') await this.boot();
    this.changed();
  }
  async create() {
    await this.storage.create();
    if (!this.disposed && this.storage.phase === 'ready') await this.boot();
    this.changed();
  }
  edit(sql: string) {
    if (sql.length <= 12000) {
      this.oversizedDraft = undefined;
      this.storage.draft?.edit(sql);
    } else {
      this.oversizedDraft = sql;
      this.feedback = queryFeedback('LIMIT');
      this.message = this.feedback.primary;
      this.changed();
    }
  }
  async run(sql: string) {
    if (!this.view.canRun || this.disposed) return;
    if (sql.length > 12000) {
      this.feedback = queryFeedback('LIMIT');
      this.message = this.feedback.primary;
      this.changed();
      return;
    }
    this.edit(sql);
    const ticket = ++this.generation;
    const run = ++this.runCount;
    this.phase = 'running';
    this.result = undefined;
    this.feedback = undefined;
    // The live query status changes once, on completion; loading is separate text.
    this.changed();
    await this.storage.draft?.flush();
    if (this.disposed || ticket !== this.generation) return;
    if (this.storage.draft?.status === 'paused') {
      this.phase = 'recovery';
      this.message =
        'Draft saving paused. Download a recovery copy before continuing.';
      this.changed();
      return;
    }
    this.queries = [sql, ...this.queries.filter((q) => q !== sql)].slice(0, 10);
    try {
      const reply = await this.engine.send({ type: 'RUN', sql });
      if (this.disposed || ticket !== this.generation) return;
      if (reply.type === 'RESULT') {
        this.result = reply.result;
        this.message = `${reply.result.rowCount} rows returned. Practice only; no evidence filed.`;
        this.phase = 'ready';
      } else {
        this.feedback = queryFeedback(
          reply.type === 'FAILED' ? reply.code : 'QUERY',
        );
        this.message = this.feedback.primary;
        this.phase =
          reply.type === 'FAILED' &&
          (reply.code === 'ENGINE' || reply.code === 'NOT_READY')
            ? 'recovery'
            : 'ready';
      }
    } catch {
      if (!this.disposed && ticket === this.generation) {
        this.feedback = queryFeedback('ENGINE_RESET');
        this.message = this.feedback.primary;
        this.phase = 'recovery';
      }
    }
    if (!this.disposed && ticket === this.generation)
      this.message = `Run ${run}: ${this.message}`;
    this.changed();
  }
  async recovery() {
    const readable = await this.storage.recovery();
    return this.oversizedDraft === undefined
      ? readable
      : JSON.stringify({
          format: 'the-quiet-index-workspace-recovery',
          localRecovery: JSON.parse(readable) as unknown,
          unsavedDraft: this.oversizedDraft,
        });
  }
  private async boot() {
    const seed = this.storage.campaign?.seed;
    if (!seed || this.disposed) return;
    const ticket = ++this.generation;
    this.phase = 'recovering';
    this.result = undefined;
    this.changed();
    try {
      const reply = await this.engine.send({ type: 'LOAD', seed });
      if (ticket !== this.generation || this.disposed) return;
      if (reply.type !== 'LOADED') throw Error('ENGINE_RESET');
      this.phase = 'ready';
      this.message =
        'Practice database ready. Your draft is independent of the query worker.';
    } catch {
      if (ticket === this.generation && !this.disposed) {
        this.phase = 'recovery';
        this.message = queryFeedback('ENGINE_RESET').primary;
      }
    }
    this.changed();
  }
  async rebuild() {
    this.generation++;
    this.engine.reset();
    await this.storage.draft?.flush();
    await this.boot();
  }
  cancel() {
    this.generation++;
    this.engine.reset();
    this.result = undefined;
    this.phase = 'stopped';
    this.changed();
  }
  async flush() {
    await this.storage.draft?.flush();
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    this.engine.dispose();
    this.storage.dispose();
  }
}
