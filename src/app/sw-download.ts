import { isRecord } from '../engine/protocol';

interface DownloadWorker {
  postMessage(message: unknown, ports: Transferable[]): void;
}
export function requestProofDownload(
  worker: DownloadWorker,
  release: string,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted)
    return Promise.reject(new Error('Download wait cancelled.'));
  const channel = new MessageChannel();
  return new Promise((resolve, reject) => {
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      channel.port1.close();
      channel.port2.close();
      if (ok) resolve();
      else
        reject(new Error('Offline download did not complete. Retry online.'));
    };
    const abort = () => finish(false);
    const timer = setTimeout(abort, 130_000);
    signal.addEventListener('abort', abort, { once: true });
    channel.port1.onmessage = (event: MessageEvent<unknown>) =>
      finish(
        isRecord(event.data) &&
          event.data.type === 'PROOF_DOWNLOADED' &&
          event.data.release === release,
      );
    channel.port1.onmessageerror = abort;
    try {
      worker.postMessage({ type: 'DOWNLOAD_PROOF', release }, [channel.port2]);
    } catch {
      abort();
    }
  });
}
