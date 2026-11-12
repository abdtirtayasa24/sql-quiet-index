import '../styles/storage.css';
import '../styles/portable.css';
import {
  TqiNavigationDesk,
  routeTitle,
} from '../components/storage/tqi-navigation-desk';
import { TqiPortableDesk } from '../components/storage/tqi-portable-desk';
import type { PortableIntent } from '../components/storage/tqi-portable-desk';
import { AppStore } from './app-store';
import { PortableController } from './portable-controller';
import { parseHash } from './router';
import { openProgress } from '../storage/progress-db';
import type { ProgressDb } from '../storage/progress-db';
import { LocalStore } from '../storage/local';
import { StorageFailure } from '../types/save';

export function mountNavigation(
  anchor: HTMLElement,
  missing: readonly string[],
) {
  if (!customElements.get('tqi-navigation-desk'))
    customElements.define('tqi-navigation-desk', TqiNavigationDesk);
  if (!customElements.get('tqi-portable-desk'))
    customElements.define('tqi-portable-desk', TqiPortableDesk);
  const desk = new TqiNavigationDesk();
  anchor.replaceWith(desk);
  let disposed = false;
  let loading = 0;
  let repo: ProgressDb | undefined;
  let focusEpoch = 0;
  let routeFocus = false;
  const store = new AppStore(() => {
    desk.view = store.view;
    document.title = `${routeTitle(store.view)} — The Quiet Index`;
    const force = routeFocus;
    routeFocus = false;
    const ticket = force ? ++focusEpoch : focusEpoch;
    void desk.updateComplete.then(() => {
      if (ticket === focusEpoch && (force || portable.view.kind === 'idle'))
        desk.querySelector<HTMLElement>(`#${store.view.focusId}`)?.focus();
    });
  });
  const portable = new PortableController(() => {
    desk.portableView = portable.view;
    desk.hasOriginal = portable.hasOriginal;
  });
  const local = new LocalStore();
  const settings = local.settings();
  document.documentElement.dataset.storageTheme = settings.theme;
  document.documentElement.dataset.storageMotion = settings.motion;
  // This engineering navigation desk is English, not a claim of full L01 localization.
  document.documentElement.lang = 'en';
  const load = async () => {
    const generation = ++loading;
    try {
      const next = await openProgress((code) => {
        if (!disposed && generation === loading) {
          loading++;
          store.dispatch({ type: 'STORAGE_ERROR', code });
        }
      });
      if (disposed || generation !== loading) {
        next.close();
        return;
      }
      repo?.close();
      repo = next;
      const records = await next.snapshot();
      if (disposed || generation !== loading) return;
      if (next.futureSchema)
        store.dispatch({
          type: 'UNSUPPORTED',
          features: [],
          reason: 'save-version',
        });
      else {
        const pointer = local.pointer();
        if (pointer.kind === 'invalid') throw new StorageFailure('corrupt');
        if (
          pointer.kind === 'present' &&
          !records.campaigns?.some(
            (row) =>
              typeof row === 'object' &&
              row !== null &&
              'campaignId' in row &&
              row.campaignId === pointer.value.campaignId,
          )
        )
          throw new StorageFailure('missing');
        store.dispatch({ type: 'RECORDS', records });
      }
      if (missing.length)
        store.dispatch({ type: 'UNSUPPORTED', features: [...missing] });
    } catch (error) {
      if (!disposed && generation === loading)
        store.dispatch({
          type: 'STORAGE_ERROR',
          code: error instanceof StorageFailure ? error.code : 'unavailable',
        });
    }
  };
  const navigate = () => {
    routeFocus = true;
    store.dispatch({ type: 'NAVIGATE', route: parseHash(location.hash) });
  };
  const skip = document.querySelector('.skip-link');
  const skipMain = (event: Event) => {
    event.preventDefault();
    document.querySelector<HTMLElement>('main')?.focus();
  };
  skip?.addEventListener('click', skipMain);
  window.addEventListener('hashchange', navigate);
  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  const focusPortable = async (ticket: number) => {
    await desk.updateComplete;
    const child = desk.querySelector('tqi-portable-desk');
    if (child instanceof TqiPortableDesk) {
      await child.updateComplete;
      if (ticket === focusEpoch)
        child
          .querySelector<HTMLElement>(
            '#portable-result, #portable-alert, #portable-preview-heading',
          )
          ?.focus();
    }
  };
  desk.addEventListener('portable-intent', (event) => {
    if (!(event instanceof CustomEvent)) return;
    const intent = (event as CustomEvent<PortableIntent>).detail;
    const ticket = ++focusEpoch;
    void (async () => {
      if (intent.type === 'SELECT') {
        await portable.select(intent.file);
        await focusPortable(ticket);
      } else if (intent.type === 'CONFIRM') {
        await portable.confirm(intent.mode, intent.confirmed);
        const completed = portable.view;
        if (completed.kind === 'done') {
          const campaignId = completed.campaignIds[0];
          if (campaignId)
            local.savePointer({
              campaignId,
              updatedAt: new Date().toISOString(),
            });
          await load();
        }
        await focusPortable(ticket);
      } else if (intent.type === 'EXPORT')
        download(await portable.exportLocal(), 'quiet-index-save.json');
      else if (intent.type === 'RECOVERY')
        download(await portable.recoveryLocal(), 'quiet-index-recovery.json');
      else {
        const original = portable.original();
        if (original) download(original, 'quiet-index-original.json');
      }
    })().catch((error) => {
      portable.report(error);
      void focusPortable(ticket);
    });
  });
  navigate();
  void load();
  const dispose = () => {
    disposed = true;
    loading++;
    store.dispose();
    portable.dispose();
    repo?.close();
    window.removeEventListener('hashchange', navigate);
    skip?.removeEventListener('click', skipMain);
  };
  const hide = (event: PageTransitionEvent) => {
    if (!event.persisted) {
      dispose();
      return;
    }
    loading++;
    repo?.close();
    repo = undefined;
    portable.suspend();
    navigate();
  };
  const show = (event: PageTransitionEvent) => {
    if (event.persisted && !disposed) {
      navigate();
      void load();
    }
  };
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  return dispose;
}
