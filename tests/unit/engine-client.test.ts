import { afterEach, expect, it, vi } from 'vitest';
import { EngineClient } from '../../src/engine/engine-client';

class Port extends EventTarget {
  sent: unknown[] = [];
  terminated = false;
  postMessage(message: unknown) {
    this.sent.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: unknown) {
    this.dispatchEvent(new MessageEvent('message', { data }));
  }
}
afterEach(() => vi.useRealTimers());

it('correlates monotonic IDs and ignores stale, malformed or wrong-kind replies', async () => {
  const port = new Port();
  const client = new EngineClient(port, 'session');
  const pending = client.send({ type: 'PROBE' });
  const message = {
    sessionId: 'session',
    requestId: 1,
    type: 'PROBE_RESULT',
    results: [],
  };
  let resolved = false;
  void pending.then(() => {
    resolved = true;
  });
  port.reply({ ...message, sessionId: 'old-session' });
  port.reply({ ...message, requestId: 2 });
  port.reply({ ...message, results: [{}] });
  port.reply({
    ...message,
    type: 'PARSE_RESULT',
    result: { ok: false, message: 'bad' },
  });
  await Promise.resolve();
  expect(resolved).toBe(false);
  port.reply(message);
  await expect(pending).resolves.toEqual(message);
  const parse = client.send({ type: 'PARSE', sql: 'SELECT 1' });
  expect(port.sent).toEqual([
    { type: 'PROBE', sessionId: 'session', requestId: 1 },
    { type: 'PARSE', sql: 'SELECT 1', sessionId: 'session', requestId: 2 },
  ]);
  port.reply({
    sessionId: 'session',
    requestId: 2,
    type: 'PARSE_RESULT',
    result: { ok: false, message: 'bad' },
  });
  await parse;
  client.dispose();
});

it('rejects pending and future requests on disposal', async () => {
  const port = new Port();
  const client = new EngineClient(port, 'session');
  const pending = expect(client.send({ type: 'PROBE' })).rejects.toThrow(
    'ENGINE_RESET',
  );
  client.dispose();
  await pending;
  expect(port.terminated).toBe(true);
  await expect(client.send({ type: 'PROBE' })).rejects.toThrow('ENGINE_RESET');
});

it.each(['error', 'messageerror'])(
  'rejects pending requests on worker %s',
  async (type) => {
    const port = new Port();
    const client = new EngineClient(port, 'session');
    const pending = expect(client.send({ type: 'PROBE' })).rejects.toThrow(
      'ENGINE_UNAVAILABLE',
    );
    port.dispatchEvent(new Event(type));
    await pending;
    expect(port.terminated).toBe(true);
  },
);

it('terminates a timed-out worker and rejects all outstanding work', async () => {
  vi.useFakeTimers();
  const port = new Port();
  const client = new EngineClient(port, 'session', 50);
  const pending = expect(client.send({ type: 'PROBE' })).rejects.toThrow(
    'ENGINE_TIMEOUT',
  );
  await vi.advanceTimersByTimeAsync(51);
  await pending;
  expect(port.terminated).toBe(true);
});
