// todo
import './polyfills';
// import './intercom';
// import './sentry';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import './styles.css';

import { hasMessage } from './api/api-errors';
import { getConfig } from './application/config';
import { DialogProvider } from './application/dialog-context';
import { notify } from './application/notify';
import { IntlProvider } from './intl/translation-provider';
import { CommandPaletteProvider } from './modules/command-palette/command-palette.provider';
import { routeTree } from './route-tree.generated';

import './api/api.intercept';

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
  defaultOptions: {
    queries: {
      refetchInterval: 5_000,
      refetchOnMount: false,
    },
  },
});

void persistQueryClient({
  queryClient,
  buster: getConfig().version,
  persister: createSyncStoragePersister({
    key: 'query-cache',
    storage: window.localStorage,
  }),
});

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient,
  },
});

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
