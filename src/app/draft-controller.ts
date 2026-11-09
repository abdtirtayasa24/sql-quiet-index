import { StorageFailure } from '../types/save';
import type { DraftStamp, StorageCode } from '../types/save';
export class DraftController {
  text: string;
  status: 'clean' | 'pending' | 'saving' | 'saved' | 'conflict' | 'paused' =
    'clean';
  error: StorageCode | undefined;
  private revision = 0;
  private stamp: DraftStamp;
  private dirty = false;
  private flight: Promise<void> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    private readonly save: (
      text: string,
      stamp: DraftStamp,
    ) => Promise<{ applied: boolean; draft: string }>,
    private readonly changed: () => void,
    private readonly tabId: string = crypto.randomUUID(),
    initial = '',
  ) {
    this.text = initial;
    this.stamp = { updatedAt: new Date().toISOString(), tabId, revision: 0 };
  }
  edit(text: string) {
    this.text = text;
    this.dirty = true;
    this.stamp = {
      updatedAt: new Date().toISOString(),
      tabId: this.tabId,
      revision: ++this.revision,
    };
    clearTimeout(this.timer);
    if (this.status !== 'paused') {
      this.status = 'pending';
      this.timer = setTimeout(() => void this.flush(), 500);
    }
    this.changed();
  }
  visibility(hidden: boolean) {
    if (hidden) void this.flush();
  }
  flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.status === 'paused') return Promise.resolve();
    if (this.flight) return this.flight.then(() => this.flush());
    if (!this.dirty) return Promise.resolve();
    const revision = this.revision;
    const text = this.text;
    const stamp = this.stamp;
    this.status = 'saving';
    this.changed();
    this.flight = this.save(text, stamp)
      .then((result) => {
        if (revision === this.revision) {
          this.dirty = false;
          this.status = result.draft === text ? 'saved' : 'conflict';
        }
      })
      .catch((error: unknown) => {
        this.status = 'paused';
        this.error = error instanceof StorageFailure ? error.code : 'aborted';
      })
      .finally(() => {
        this.flight = undefined;
        this.changed();
      });
    return this.flight;
  }
  dispose() {
    clearTimeout(this.timer);
  }
}
