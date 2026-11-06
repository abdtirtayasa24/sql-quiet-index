export type UpdateState =
  'current' | 'available' | 'deferred' | 'applying' | 'blocked' | 'failed';
interface UpdateWorker extends EventTarget {
  state: string;
  postMessage(message: unknown): void;
}
interface UpdateRegistration extends EventTarget {
  waiting: UpdateWorker | null;
  installing: UpdateWorker | null;
  update(): Promise<unknown>;
}

export class UpdateController {
  state: UpdateState = 'current';
  private installing: UpdateWorker | null = null;
  private closed = false;
  private cancelActivation: (() => void) | undefined;
  private readonly inspect = () => {
    if (this.closed) return;
    if (this.installing !== this.registration.installing) {
      this.installing?.removeEventListener('statechange', this.inspect);
      this.installing = this.registration.installing;
      this.installing?.addEventListener('statechange', this.inspect);
    }
    if (this.registration.waiting && this.state !== 'applying')
      this.set('available');
  };
  constructor(
    private readonly registration: UpdateRegistration,
    private readonly changed: (state: UpdateState) => void,
  ) {
    registration.addEventListener('updatefound', this.inspect);
    this.inspect();
  }
  private set(state: UpdateState) {
    this.state = state;
    this.changed(state);
  }
  defer() {
    this.set('deferred');
  }
  async check() {
    try {
      await this.registration.update();
      this.inspect();
    } catch {
      this.set('failed');
    }
  }
  async approve(
    checkpoint: () => Promise<boolean>,
    reload: () => void,
  ): Promise<boolean> {
    const worker = this.registration.waiting;
    if (this.closed || !worker || this.state === 'applying') return false;
    this.set('applying');
    try {
      if (!(await checkpoint()) || this.closed) {
        this.set('blocked');
        return false;
      }
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timer);
          worker.removeEventListener('statechange', activated);
          this.cancelActivation = undefined;
        };
        const activated = () => {
          if (worker.state === 'activated') {
            cleanup();
            resolve();
          } else if (worker.state === 'redundant') {
            cleanup();
            reject(new Error('Update unavailable'));
          }
        };
        const cancel = () => {
          cleanup();
          reject(new Error('Update interrupted'));
        };
        const timer = setTimeout(cancel, 15_000);
        this.cancelActivation = cancel;
        worker.addEventListener('statechange', activated);
        try {
          worker.postMessage({ type: 'SKIP_WAITING' });
          activated();
        } catch {
          cancel();
        }
      });
      if (this.closed) return false;
      reload();
      return true;
    } catch {
      if (!this.closed) this.set('failed');
      return false;
    }
  }
  dispose() {
    this.closed = true;
    this.cancelActivation?.();
    this.installing?.removeEventListener('statechange', this.inspect);
    this.registration.removeEventListener('updatefound', this.inspect);
  }
}
