import { isWorkspaceReply, isWorkspaceRequest } from './workspace-protocol';
import type { WorkspaceCommand, WorkspaceReply } from './workspace-protocol';
interface Port {
  postMessage(message: unknown): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  terminate(): void;
}
interface Job {
  command: WorkspaceCommand;
  resolve: (reply: WorkspaceReply) => void;
  reject: (error: Error) => void;
}
export class WorkspaceClient {
  private worker: Port | undefined;
  private sessionId = '';
  private sequence = 0;
  private closed = false;
  private queue: Job[] = [];
  private active: (Job & { requestId: number }) | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly receive: EventListener = (event) => {
    if (!(event instanceof MessageEvent) || !isWorkspaceReply(event.data))
      return;
    const reply = event.data;
    const job = this.active;
    if (
      !job ||
      reply.sessionId !== this.sessionId ||
      reply.requestId !== job.requestId ||
      (reply.type !== 'FAILED' &&
        reply.type !== (job.command.type === 'LOAD' ? 'LOADED' : 'RESULT'))
    )
      return;
    if (
      reply.type === 'LOADED' &&
      job.command.type === 'LOAD' &&
      reply.seed !== job.command.seed
    )
      return;
    clearTimeout(this.timer);
    this.active = undefined;
    job.resolve(reply);
    this.pump();
  };
  private readonly failed: EventListener = () => this.reset();
  constructor(
    private readonly factory: () => Port = () =>
      new Worker(new URL('../workers/workspace.worker.ts', import.meta.url), {
        type: 'module',
        name: 'tqi-workspace',
      }),
    private readonly queryMs = 2500,
    private readonly bootMs = 60000,
  ) {}
  send(command: WorkspaceCommand): Promise<WorkspaceReply> {
    if (this.closed) return Promise.reject(new Error('ENGINE_RESET'));
    if (
      !isWorkspaceRequest({ ...command, sessionId: 'validate', requestId: 1 })
    )
      return Promise.reject(new Error('INVALID_REQUEST'));
    return new Promise((resolve, reject) => {
      this.queue.push({ command, resolve, reject });
      this.pump();
    });
  }
  private pump() {
    if (this.active || this.closed) return;
    const job = this.queue.shift();
    if (!job) return;
    this.active = { ...job, requestId: ++this.sequence };
    try {
      if (!this.worker) {
        this.sessionId = crypto.randomUUID();
        this.worker = this.factory();
        this.worker.addEventListener('message', this.receive);
        this.worker.addEventListener('error', this.failed);
        this.worker.addEventListener('messageerror', this.failed);
      }
      this.timer = setTimeout(
        () => this.reset(),
        job.command.type === 'LOAD' ? this.bootMs : this.queryMs,
      );
      this.worker.postMessage({
        ...job.command,
        sessionId: this.sessionId,
        requestId: this.active.requestId,
      });
    } catch {
      this.reset();
    }
  }
  reset() {
    clearTimeout(this.timer);
    this.worker?.removeEventListener('message', this.receive);
    this.worker?.removeEventListener('error', this.failed);
    this.worker?.removeEventListener('messageerror', this.failed);
    this.worker?.terminate();
    this.worker = undefined;
    const jobs = [...(this.active ? [this.active] : []), ...this.queue];
    this.active = undefined;
    this.queue = [];
    for (const job of jobs) job.reject(new Error('ENGINE_RESET'));
  }
  dispose() {
    this.closed = true;
    this.reset();
  }
}
