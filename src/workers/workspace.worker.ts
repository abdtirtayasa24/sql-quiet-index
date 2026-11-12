import { PGlite } from '@electric-sql/pglite';
import { loadPractice, runPractice } from '../engine/workspace-data';
import { isWorkspaceRequest } from '../engine/workspace-protocol';
import type {
  WorkspaceReply,
  WorkspaceRequest,
} from '../engine/workspace-protocol';
let database: Promise<PGlite> | undefined;
let loaded = false;
let queue = Promise.resolve();
let session: string | undefined;
let sequence = 0;
async function handle(request: WorkspaceRequest) {
  const identity = {
    sessionId: request.sessionId,
    requestId: request.requestId,
  };
  let reply: WorkspaceReply;
  try {
    const pg = await (database ??= PGlite.create({ dataDir: 'memory://' }));
    if (request.type === 'LOAD') {
      loaded = false;
      await loadPractice(pg, request.seed);
      loaded = true;
      reply = { ...identity, type: 'LOADED', seed: request.seed };
    } else if (!loaded)
      reply = { ...identity, type: 'FAILED', code: 'NOT_READY' };
    else {
      const outcome = await runPractice(pg, request.sql);
      reply = outcome.ok
        ? { ...identity, type: 'RESULT', result: outcome.result }
        : { ...identity, type: 'FAILED', code: outcome.code };
    }
  } catch {
    loaded = false;
    reply = { ...identity, type: 'FAILED', code: 'ENGINE' };
  }
  globalThis.postMessage(reply);
}
globalThis.addEventListener('message', (event: MessageEvent<unknown>) => {
  const request = event.data;
  if (!isWorkspaceRequest(request)) return;
  session ??= request.sessionId;
  if (request.sessionId !== session || request.requestId <= sequence) return;
  sequence = request.requestId;
  queue = queue.then(() => handle(request));
});
