import './polyfills';
import './sentry';
import './intercom';

import ReactDOM from 'react-dom/client';

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';

import { hasMessage } from './api/api-errors';
import { App } from './app';
import { notify } from './application/notify';
import { Providers } from './application/providers';

import './api/api.intercept';

// https://vitejs.dev/guide/build#load-error-handling
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

// https://github.com/facebook/react/issues/10474
function isGuardedCallbackDev() {
  const index = new Error().stack?.indexOf('invokeGuardedCallbackDev');
  return index && index >= 0;
}

window.addEventListener('error', function (event) {
  const error: unknown = event.error;

  if (hasMessage(error) && !isGuardedCallbackDev()) {
    notify.error(error.message);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Providers>
    <App />
  </Providers>,
);
