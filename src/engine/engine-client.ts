import { isEngineRequest, isEngineResponse } from './protocol';
import type { EngineCommand, EngineResponse } from './protocol';

interface EnginePort {
  postMessage(message: unknown): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  terminate(): void;
}
interface Pending {
  expected: EngineResponse['type'];
  resolve: (reply: EngineResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class EngineClient {
  private sequence = 0;
  private closed = false;
  private readonly pending = new Map<number, Pending>();
  private readonly receive: EventListener = (event) => {
    if (!(event instanceof MessageEvent)) return;
    const reply: unknown = event.data;
    if (!isEngineResponse(reply) || reply.sessionId !== this.sessionId) return;
    const pending = this.pending.get(reply.requestId);
    if (!pending || (reply.type !== pending.expected && reply.type !== 'ERROR'))
      return;
    clearTimeout(pending.timer);
    this.pending.delete(reply.requestId);
    if (reply.type === 'ERROR') pending.reject(new Error(reply.message));
    else pending.resolve(reply);
  };
  private readonly fail: EventListener = () =>
    this.dispose('ENGINE_UNAVAILABLE');

  constructor(
    private readonly worker: EnginePort = new Worker(
      new URL('../workers/postgres.worker.ts', import.meta.url),
      { type: 'module', name: 'tqi-postgres' },
    ),
    private readonly sessionId: string = crypto.randomUUID(),
    private readonly deadlineMs = 60_000,
  ) {
    worker.addEventListener('message', this.receive);
    worker.addEventListener('error', this.fail);
    worker.addEventListener('messageerror', this.fail);
  }

  send(command: EngineCommand): Promise<EngineResponse> {
    if (this.closed) return Promise.reject(new Error('ENGINE_RESET'));
    const request = {
      ...command,
      sessionId: this.sessionId,
      requestId: ++this.sequence,
    };
    if (!isEngineRequest(request))
      return Promise.reject(new Error('INVALID_REQUEST'));
    return new Promise((resolve, reject) => {
      this.pending.set(request.requestId, {
        expected: command.type === 'PROBE' ? 'PROBE_RESULT' : 'PARSE_RESULT',
        resolve,
        reject,
        timer: setTimeout(
          () => this.dispose('ENGINE_TIMEOUT'),
          this.deadlineMs,
        ),
      });
      try {
        this.worker.postMessage(request);
      } catch {
        this.dispose('ENGINE_UNAVAILABLE');
      }
    });
  }

  dispose(reason = 'ENGINE_RESET'): void {
    if (this.closed) return;
    this.closed = true;
    this.worker.removeEventListener('message', this.receive);
    this.worker.removeEventListener('error', this.fail);
    this.worker.removeEventListener('messageerror', this.fail);
    this.worker.terminate();
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
    }
    this.pending.clear();
  }
}
