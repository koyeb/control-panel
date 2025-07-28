import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './api/api.intercept';
import './intercom';
import './sentry';
import './side-effects';
import './styles.css';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import qs from 'query-string';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api/api-errors';
import { container } from './application/container';
import { DialogProvider } from './application/dialog-context';
import { PostHogProvider } from './application/posthog';
import { NotificationContainer } from './components/notification';
import { IntlProvider } from './intl/translation-provider';
import { CommandPaletteProvider } from './modules/command-palette/command-palette.provider';
import { routeTree } from './route-tree.generated';
import { TOKENS } from './tokens';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5_000,
      retry: (retryCount, error) => {
        if (ApiError.is(error) && error.status >= 500) {
          return retryCount <= 3;
        }

        return false;
      },
    },
  },
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
  Wrap({ children }) {
    const config = container.resolve(TOKENS.config);
    const auth = container.resolve(TOKENS.authentication);

    const persister = createAsyncStoragePersister({
      key: 'query-cache',
      storage: auth.session ? window.sessionStorage : window.localStorage,
    });

    return (
      <IntlProvider>
        <QueryClientProvider client={queryClient}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister, buster: config.get('version') }}
          >
            <DialogProvider>
              <CommandPaletteProvider>
                <ReactQueryDevtools />
                <NotificationContainer />
                {children}
              </CommandPaletteProvider>
            </DialogProvider>
          </PersistQueryClientProvider>
        </QueryClientProvider>
      </IntlProvider>
    );
  },
  InnerWrap({ children }) {
    return (
      <PostHogProvider>
        <TanStackRouterDevtools />
        {children}
      </PostHogProvider>
    );
  },
});

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
