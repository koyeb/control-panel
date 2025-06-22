import './intercom';
import './polyfills';
import './sentry';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import './styles.css';

import { hasMessage } from './api/api-errors';
import { DialogProvider } from './application/dialog-context';
import { notify } from './application/notify';
import { TokenProvider } from './application/token';
import { IntlProvider } from './intl/translation-provider';
import { CommandPaletteProvider } from './modules/command-palette/command-palette.provider';
import { routeTree } from './route-tree.generated';

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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
    },
  },
});

const router = createRouter({
  routeTree,
  context: {},
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <IntlProvider>
    <TokenProvider>
      <QueryClientProvider client={queryClient}>
        <DialogProvider>
          <CommandPaletteProvider>
            <RouterProvider router={router} />
          </CommandPaletteProvider>
        </DialogProvider>
      </QueryClientProvider>
    </TokenProvider>
  </IntlProvider>,
);
