import { afterEach, expect, it, vi } from 'vitest';
import { WorkspaceClient } from '../../src/engine/workspace-client';
class Port extends EventTarget {
  sent: Record<string, unknown>[] = [];
  terminated = false;
  postMessage(message: Record<string, unknown>) {
    this.sent.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  reply(extra: Record<string, unknown>, index = 0) {
    this.dispatchEvent(
      new MessageEvent('message', { data: { ...this.sent[index], ...extra } }),
    );
  }
}
afterEach(() => vi.useRealTimers());
it('serializes requests and rejects wrong-session, wrong-kind, malformed replies', async () => {
  const p = new Port();
  const c = new WorkspaceClient(() => p);
  const a = c.send({ type: 'LOAD', seed: '1234abcd' });
  const b = c.send({ type: 'RUN', sql: 'SELECT 1' });
  await Promise.resolve();
  expect(p.sent).toHaveLength(1);
  p.reply({ type: 'LOADED', sessionId: 'stale' });
  p.reply({ type: 'RESULT', result: {} });
  expect(p.sent).toHaveLength(1);
  p.reply({ type: 'LOADED', seed: '1234abcd' });
  await a;
  await vi.waitFor(() => expect(p.sent).toHaveLength(2));
  p.reply({ type: 'RESULT', result: { fields: [], rows: [], rowCount: 0 } }, 1);
  await expect(b).resolves.toMatchObject({ type: 'RESULT' });
  c.dispose();
});
it('timeout/reset rejects active and queued work as ENGINE_RESET; next request uses fresh session', async () => {
  vi.useFakeTimers();
  const ports: Port[] = [];
  const c = new WorkspaceClient(() => {
    const p = new Port();
    ports.push(p);
    return p;
  }, 40);
  const a = expect(c.send({ type: 'RUN', sql: 'SELECT 1' })).rejects.toThrow(
    'ENGINE_RESET',
  );
  const b = expect(c.send({ type: 'RUN', sql: 'SELECT 2' })).rejects.toThrow(
    'ENGINE_RESET',
  );
  await vi.advanceTimersByTimeAsync(41);
  await a;
  await b;
  expect(ports[0]?.terminated).toBe(true);
  const load = c.send({ type: 'LOAD', seed: '1234abcd' });
  await Promise.resolve();
  expect(ports[1]?.sent[0]?.sessionId).not.toBe(ports[0]?.sent[0]?.sessionId);
  ports[0]?.reply({ type: 'LOADED', seed: '1234abcd' });
  ports[1]?.reply({ type: 'LOADED', seed: '1234abcd' });
  await load;
  c.dispose();
});
it.each(['error', 'messageerror'])('recovers after worker %s', async (kind) => {
  const p = new Port();
  const c = new WorkspaceClient(() => p);
  const a = expect(c.send({ type: 'RUN', sql: 'SELECT 1' })).rejects.toThrow(
    'ENGINE_RESET',
  );
  await Promise.resolve();
  p.dispatchEvent(new Event(kind));
  await a;
  c.dispose();
});
it('handles construction failures and disposal without unhandled queued work', async () => {
  const c = new WorkspaceClient(() => {
    throw Error('unavailable');
  });
  await expect(c.send({ type: 'LOAD', seed: '1234abcd' })).rejects.toThrow(
    'ENGINE_RESET',
  );
  c.dispose();
  await expect(c.send({ type: 'RUN', sql: 'SELECT 1' })).rejects.toThrow(
    'ENGINE_RESET',
  );
});
