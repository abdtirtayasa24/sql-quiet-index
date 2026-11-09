import './styles/tokens.css';
import './styles/global.css';
import './styles/storage.css';
import { TqiStorageDesk } from './components/storage/tqi-storage-desk';
import { StorageController } from './app/storage-controller';
import { storageCopy } from './app/storage-copy';
import type { Settings } from './storage/local';

customElements.define('tqi-storage-desk', TqiStorageDesk);
const desk = document.querySelector('tqi-storage-desk');
if (desk instanceof TqiStorageDesk) {
  const controller = new StorageController(() => {
    desk.view = controller.view;
    const settings = controller.settings;
    document.documentElement.lang = settings.locale;
    document.documentElement.dataset.storageTheme = settings.theme;
    document.documentElement.dataset.storageMotion = settings.motion;
    document.title = `${storageCopy[settings.locale].lead} — The Quiet Index`;
    const skip = document.querySelector('.skip-link');
    if (skip)
      skip.textContent =
        settings.locale === 'id'
          ? 'Lewati ke meja penyimpanan'
          : 'Skip to storage desk';
  });
  desk.addEventListener('storage-create', () => {
    void controller
      .create()
      .then(() => desk.updateComplete)
      .then(() =>
        desk.querySelector<HTMLTextAreaElement>('#storage-draft')?.focus(),
      );
  });
  desk.addEventListener('storage-retry', () => void controller.start());
  desk.addEventListener('storage-draft', (event) => {
    if (event instanceof CustomEvent && typeof event.detail === 'string')
      controller.draft?.edit(event.detail);
  });
  desk.addEventListener('storage-settings', (event) => {
    if (event instanceof CustomEvent)
      controller.setSettings((event as CustomEvent<Settings>).detail);
  });
  desk.addEventListener('storage-download', () => {
    void controller
      .recovery()
      .then((text) => {
        const url = URL.createObjectURL(
          new Blob([text], { type: 'application/json' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quiet-index-recovery.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        desk.downloadError = false;
      })
      .catch(() => {
        desk.downloadError = true;
      });
  });
  document.addEventListener('visibilitychange', () =>
    controller.draft?.visibility(document.visibilityState === 'hidden'),
  );
  window.addEventListener('pagehide', () => {
    void controller.draft?.flush();
  });
  void controller.start();
}
