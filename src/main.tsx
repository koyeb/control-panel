// todo
import './polyfills';
import './intercom';
import './sentry';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import './styles.css';

import { ApiError, hasMessage } from './api/api-errors';
import { DialogProvider } from './application/dialog-context';
import { notify } from './application/notify';
import { LogoLoading } from './components/logo-loading';
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
        queryClient.clear();
        window.location.reload();
      }
    },
  }),
  defaultOptions: {
    queries: {
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

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingComponent: LogoLoading,
  defaultPendingMs: 0,
  defaultPendingMinMs: 0,
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  context: {
    queryClient,
  },
});

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
