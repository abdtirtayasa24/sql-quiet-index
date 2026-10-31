import './styles/tokens.css';
import './styles/global.css';
import { missingCapabilities } from './app/compatibility';

void import('./app/app')
  .then(({ TqiApp }) => {
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
