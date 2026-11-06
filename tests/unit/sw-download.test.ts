import { expect, it } from 'vitest';
import { requestProofDownload } from '../../src/app/sw-download';

it('resolves only a matching success from the transferred private message port', async () => {
  const worker = {
    postMessage(message: unknown, ports: Transferable[]) {
      expect(message).toEqual({ type: 'DOWNLOAD_PROOF', release: 'test-a' });
      const port = ports[0];
      if (!(port instanceof MessagePort))
        throw new Error('Expected MessagePort');
      port.postMessage({ type: 'PROOF_DOWNLOADED', release: 'test-a' });
    },
  };
  await expect(
    requestProofDownload(worker, 'test-a', new AbortController().signal),
  ).resolves.toBeUndefined();
});
it('rejects wrong-release replies rather than declaring an offline pack ready', async () => {
  const worker = {
    postMessage(_message: unknown, ports: Transferable[]) {
      const port = ports[0];
      if (!(port instanceof MessagePort))
        throw new Error('Expected MessagePort');
      port.postMessage({ type: 'PROOF_DOWNLOADED', release: 'test-b' });
    },
  };
  await expect(
    requestProofDownload(worker, 'test-a', new AbortController().signal),
  ).rejects.toThrow();
});
it('aborts the client wait without pretending that partial data is complete', async () => {
  const abort = new AbortController();
  const pending = requestProofDownload(
    { postMessage() {} },
    'test-a',
    abort.signal,
  );
  abort.abort();
  await expect(pending).rejects.toThrow();
});
