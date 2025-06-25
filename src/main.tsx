// todo
import './intercom';
import './polyfills';
import './sentry';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { AnyRouter, createRouter, RouterProvider } from '@tanstack/react-router';
import qs from 'query-string';
import ReactDOM from 'react-dom/client';

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import './styles.css';

import { ApiError, hasMessage } from './api/api-errors';
import { isSessionToken, setToken } from './application/authentication';
import { getConfig } from './application/config';
import { DialogProvider } from './application/dialog-context';
import { notify } from './application/notify';
import { IntlProvider } from './intl/translation-provider';
import { CommandPaletteProvider } from './modules/command-palette/command-palette.provider';
import { routeTree } from './route-tree.generated';

import './api/api.intercept';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }

  interface HistoryState {
    githubAppInstallationRequested?: boolean;
    createOrganization?: boolean;
    create?: boolean;
  }
}

declare global {
  interface Window {
    router: AnyRouter;
    queryClient: QueryClient;
  }
}

Error.stackTraceLimit = 2 << 16;

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
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        setToken(null);
        void router.invalidate();
      }
    },
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      refetchInterval: 5_000,
      retry: (retryCount, error) => {
        if (error instanceof ApiError && error.status >= 500) {
          return retryCount < 5;
        }

        return false;
      },
    },
  },
});

void persistQueryClient({
  queryClient,
  buster: getConfig().version,
  persister: createSyncStoragePersister({
    key: 'query-cache',
    storage: isSessionToken() ? window.sessionStorage : window.localStorage,
  }),
});

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingMs: 0,
  defaultPendingMinMs: 0,
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  parseSearch: qs.parse,
  stringifySearch: (value) => {
    const result = qs.stringify(value);
    return result !== '' ? `?${result}` : '';
  },
  context: {
    queryClient,
  },
});

window.router = router;
window.queryClient = queryClient;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <IntlProvider>
    <QueryClientProvider client={queryClient}>
      <DialogProvider>
        <CommandPaletteProvider>
          <RouterProvider router={router} />
        </CommandPaletteProvider>
      </DialogProvider>
    </QueryClientProvider>
  </IntlProvider>,
);
