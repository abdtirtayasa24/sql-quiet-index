import { expect, it } from 'vitest';
import { WorkspaceController } from '../../src/app/workspace-controller';
import { StorageController } from '../../src/app/storage-controller';
import { LocalStore } from '../../src/storage/local';
import { newCampaign } from '../../src/storage/schema';
import type {
  WorkspaceCommand,
  WorkspaceReply,
} from '../../src/engine/workspace-protocol';
function fixture() {
  const campaign = newCampaign('en');
  const storage = new StorageController(
    () => {},
    new LocalStore(() => ({ getItem: () => null, setItem: () => {} })),
    () =>
      Promise.resolve({
        futureSchema: false,
        close() {},
        create: () => Promise.resolve(campaign),
        snapshot: () => Promise.resolve({ campaigns: [campaign] }),
        saveDraft: (_c, _m, sql) =>
          Promise.resolve({ applied: true, draft: sql }),
      }),
  );
  const commands: WorkspaceCommand[] = [];
  let reset = 0;
  const engine = {
    send: (command: WorkspaceCommand): Promise<WorkspaceReply> => {
      commands.push(command);
      return Promise.resolve(
        command.type === 'LOAD'
          ? { type: 'LOADED', seed: command.seed, sessionId: 's', requestId: 1 }
          : {
              type: 'RESULT',
              result: { fields: [], rows: [], rowCount: 0 },
              sessionId: 's',
              requestId: 2,
            },
      );
    },
    reset() {
      reset++;
    },
    dispose() {
      reset++;
    },
  };
  return {
    storage,
    engine,
    commands,
    get resets() {
      return reset;
    },
    campaign,
  };
}
it('loads saved seed and saves current draft before a run without awarding completion', async () => {
  const f = fixture();
  const c = new WorkspaceController(() => {}, f.storage, f.engine);
  await c.start();
  c.edit('SELECT 1');
  await c.run('SELECT 1');
  expect(f.commands).toEqual([
    { type: 'LOAD', seed: f.campaign.seed },
    { type: 'RUN', sql: 'SELECT 1' },
  ]);
  expect(c.storage.draft?.status).toBe('saved');
  expect(c.view.phase).toBe('ready');
  expect(f.campaign.completedMissionIds).toEqual([]);
  c.dispose();
});
it('reset retains draft and restores identical seed before accepting another run', async () => {
  const f = fixture();
  const c = new WorkspaceController(() => {}, f.storage, f.engine);
  await c.start();
  c.edit('SELECT 2');
  await c.rebuild();
  expect(c.storage.draft?.text).toBe('SELECT 2');
  expect(f.commands.at(-1)).toEqual({ type: 'LOAD', seed: f.campaign.seed });
  expect(f.resets).toBe(1);
  c.dispose();
});
it('navigation/cancel ignores late results', async () => {
  const f = fixture();
  const c = new WorkspaceController(() => {}, f.storage, f.engine);
  await c.start();
  let resolve: (r: WorkspaceReply) => void = () => {};
  f.engine.send = () =>
    new Promise((r) => {
      resolve = r;
    });
  const run = c.run('SELECT 1');
  await new Promise((r) => setTimeout(r, 0));
  c.cancel();
  resolve({
    type: 'RESULT',
    result: { fields: [], rows: [], rowCount: 0 },
    sessionId: 's',
    requestId: 2,
  });
  await run;
  expect(c.view.result).toBeUndefined();
  expect(c.view.phase).toBe('stopped');
  c.dispose();
});
it('oversized edits never claim saved and remain downloadable without replacing canonical draft', async () => {
  const f = fixture();
  const c = new WorkspaceController(() => {}, f.storage, f.engine);
  await c.start();
  c.edit('SELECT 1');
  await c.flush();
  const text = 'x'.repeat(12001);
  c.edit(text);
  expect(c.view.canRun).toBe(false);
  expect(c.view.unsavedDraft).toBe(true);
  expect(await c.recovery()).toContain(text);
  expect(c.storage.draft?.text).toBe('SELECT 1');
  c.edit('SELECT 2');
  expect(c.view.unsavedDraft).toBe(false);
  c.dispose();
});
it('repeated identical results have distinct completion announcements', async () => {
  const f = fixture();
  const c = new WorkspaceController(() => {}, f.storage, f.engine);
  await c.start();
  await c.run('SELECT 1');
  const first = c.view.message;
  await c.run('SELECT 1');
  expect(c.view.message).not.toBe(first);
  c.dispose();
});
it('worker failure offers explicit recovery rather than rerunning SQL', async () => {
  const f = fixture();
  const c = new WorkspaceController(() => {}, f.storage, f.engine);
  await c.start();
  f.engine.send = () => Promise.reject(new Error('ENGINE_RESET'));
  await c.run('SELECT 1');
  expect(c.view.phase).toBe('recovery');
  expect(c.view.message).toContain('draft');
  c.dispose();
});
