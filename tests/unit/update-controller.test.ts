import { expect, it } from 'vitest';
import { UpdateController } from '../../src/app/update-controller';

class WaitingWorker extends EventTarget {
  state = 'installed';
  messages: unknown[] = [];
  postMessage(message: unknown) {
    this.messages.push(message);
    this.state = 'activated';
    this.dispatchEvent(new Event('statechange'));
  }
}
function fixture() {
  const worker = new WaitingWorker();
  const registration = Object.assign(new EventTarget(), {
    waiting: worker,
    installing: null,
    update: () => Promise.resolve(),
  });
  const controller = new UpdateController(registration, () => {});
  return { worker, controller };
}
it('initial discovery and defer never activate or reload a waiting worker', () => {
  const { worker, controller } = fixture();
  expect(controller.state).toBe('available');
  controller.defer();
  expect(controller.state).toBe('deferred');
  expect(worker.messages).toEqual([]);
  controller.dispose();
});
it('refuses activation if the safe-checkpoint step declines or fails', async () => {
  const { worker, controller } = fixture();
  let reloads = 0;
  expect(
    await controller.approve(
      () => Promise.resolve(false),
      () => reloads++,
    ),
  ).toBe(false);
  expect(
    await controller.approve(
      () => Promise.reject(new Error('not saved')),
      () => reloads++,
    ),
  ).toBe(false);
  expect(worker.messages).toEqual([]);
  expect(reloads).toBe(0);
  controller.dispose();
});
it('activates only after explicit approval and reloads only the approving page after activation', async () => {
  const { worker, controller } = fixture();
  let reloads = 0;
  expect(
    await controller.approve(
      () => Promise.resolve(true),
      () => reloads++,
    ),
  ).toBe(true);
  expect(worker.messages).toEqual([{ type: 'SKIP_WAITING' }]);
  expect(reloads).toBe(1);
  controller.dispose();
});
