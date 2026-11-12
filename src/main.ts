import './styles/tokens.css';
import './styles/global.css';
import { missingCapabilities } from './app/compatibility';

let navigationActive = false;
function activateNavigation() {
  if (navigationActive || !location.hash.startsWith('#/')) return;
  navigationActive = true;
  void import('./app/navigation')
    .then(({ mountNavigation }) => {
      const anchor = document.querySelector('tqi-app');
      if (anchor instanceof HTMLElement)
        mountNavigation(
          anchor,
          missingCapabilities({
            secureContext: window.isSecureContext,
            worker: typeof Worker !== 'undefined',
            webAssembly: typeof WebAssembly !== 'undefined',
            indexedDB: 'indexedDB' in window,
            cacheStorage: 'caches' in window,
          }),
        );
    })
    .catch(() => {
      const target = document.querySelector('tqi-app');
      if (target) {
        const notice = document.createElement('p');
        notice.setAttribute('role', 'alert');
        notice.textContent =
          'Navigation could not load. Reload to retry; no case data was reset.';
        target.append(notice);
      }
    });
}
window.addEventListener('hashchange', activateNavigation);
activateNavigation();

void import('./app/app')
  .then(({ TqiApp }) => {
    if (navigationActive) return;
    customElements.define('tqi-app', TqiApp);
    const app = document.querySelector('tqi-app');
    if (app instanceof TqiApp) {
      app.missingCapabilities = missingCapabilities({
        secureContext: window.isSecureContext,
        worker: typeof Worker !== 'undefined',
        webAssembly: typeof WebAssembly !== 'undefined',
        indexedDB: 'indexedDB' in window,
        cacheStorage: 'caches' in window,
      });
    }
  })
  .catch(() => {
    const notice = document.getElementById('boot-notice');
    if (notice) {
      notice.setAttribute('role', 'alert');
      notice.textContent =
        'The interface could not load. Check your connection and reload. This introduction is still available.';
    }
  });
