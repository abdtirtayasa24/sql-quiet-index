import { isBootResult } from '../engine/boot-benchmark';
import type { BootResult, BootStrategy } from '../engine/boot-benchmark';

declare const __M0_RELEASE__: string;

export interface BootTrial extends BootResult {
  firstPlayableMs: number;
}
export function benchmarkBoot(
  strategy: BootStrategy,
  signal: AbortSignal,
): Promise<BootTrial> {
  if (signal.aborted) return Promise.reject(new Error('Benchmark cancelled.'));
  const start = performance.now();
  const worker = new Worker(
    new URL('../workers/boot-benchmark.worker.ts', import.meta.url),
    { type: 'module', name: 'tqi-boot-benchmark' },
  );
  return new Promise((resolve, reject) => {
    const finish = (result?: BootResult) => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.terminate();
      if (result)
        resolve({ ...result, firstPlayableMs: performance.now() - start });
      else
        reject(
          new Error(
            'Benchmark unavailable or cancelled. Retry online; no saved data changed.',
          ),
        );
    };
    const abort = () => finish();
    const timer = setTimeout(abort, 60_000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<unknown>) =>
      finish(
        isBootResult(event.data) &&
          event.data.strategy === strategy &&
          event.data.release === __M0_RELEASE__
          ? event.data
          : undefined,
      );
    worker.onerror = abort;
    worker.onmessageerror = abort;
    worker.postMessage(strategy);
  });
}
