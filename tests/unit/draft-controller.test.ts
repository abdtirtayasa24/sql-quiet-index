import { afterEach, expect, it, vi } from 'vitest';
import { DraftController } from '../../src/app/draft-controller';
afterEach(() => vi.useRealTimers());
it('debounces at 500ms and hidden visibility flushes the latest immediate text', async () => {
  vi.useFakeTimers();
  const saved: string[] = [];
  const draft = new DraftController(
    (text) => {
      saved.push(text);
      return Promise.resolve({ applied: true, draft: text });
    },
    () => {},
    'tab',
  );
  draft.edit('first');
  await vi.advanceTimersByTimeAsync(499);
  expect(saved).toEqual([]);
  draft.edit('latest');
  draft.visibility(true);
  await draft.flush();
  expect(saved).toEqual(['latest']);
  expect(draft.status).toBe('saved');
  draft.edit('500ms');
  await vi.advanceTimersByTimeAsync(500);
  expect(saved).toEqual(['latest', '500ms']);
  draft.dispose();
});
it('a write finishing cannot mark a newer edit saved and flush serializes both', async () => {
  let finish:
    ((value: { applied: boolean; draft: string }) => void) | undefined;
  const saved: string[] = [];
  const draft = new DraftController(
    (text) => {
      saved.push(text);
      return saved.length === 1
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : Promise.resolve({ applied: true, draft: text });
    },
    () => {},
    'tab',
  );
  draft.edit('old');
  const old = draft.flush();
  draft.edit('new');
  const all = draft.flush();
  finish?.({ applied: true, draft: 'old' });
  await old;
  await all;
  expect(saved).toEqual(['old', 'new']);
  expect(draft.status).toBe('saved');
  expect(draft.text).toBe('new');
  draft.dispose();
});
it('failure pauses further writes but preserves the latest work for recovery', async () => {
  const save = vi.fn(() => Promise.reject(new Error('quota')));
  const draft = new DraftController(save, () => {}, 'tab');
  draft.edit('private SQL');
  await draft.flush();
  draft.edit('keep newest');
  await draft.flush();
  expect(draft.status).toBe('paused');
  expect(draft.text).toBe('keep newest');
  expect(save).toHaveBeenCalledTimes(1);
  draft.dispose();
});
it('an older losing write is not falsely announced as saved', async () => {
  const draft = new DraftController(
    () => Promise.resolve({ applied: false, draft: 'other tab' }),
    () => {},
    'tab',
  );
  draft.edit('my work');
  await draft.flush();
  expect(draft.status).toBe('conflict');
  expect(draft.text).toBe('my work');
  draft.dispose();
});
