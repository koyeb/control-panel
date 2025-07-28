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
import { StrictMode, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api/api-errors';
import { container } from './application/container';
import { DialogProvider } from './application/dialog-context';
import { PostHogProvider } from './application/posthog';
import { NotificationContainer } from './components/notification';
import { IntlProvider, createTranslateFn } from './intl/translation-provider';
import { CommandPaletteProvider } from './modules/command-palette';
import { routeTree } from './route-tree.generated';
import { TOKENS } from './tokens';
import { getConfig } from './utils/config';

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
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  parseSearch: qs.parse,
  stringifySearch: (value) => {
    const result = qs.stringify(value);
    return result !== '' ? `?${result}` : '';
  },
  context: {
    queryClient,
    translate: createTranslateFn(),
  },
  Wrap({ children }) {
    const persister = useQueryClientPersister();
    const auth = container.resolve(TOKENS.authentication);

    useEffect(() => {
      return auth.listen(() => void queryClient.invalidateQueries());
    }, [auth]);

    return (
      <IntlProvider>
        <QueryClientProvider client={queryClient}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister, buster: getConfig('version') }}
          >
            <DialogProvider>{children}</DialogProvider>
          </PersistQueryClientProvider>
        </QueryClientProvider>
      </IntlProvider>
    );
  },
  InnerWrap({ children }) {
    return (
      <PostHogProvider>
        <CommandPaletteProvider>
          {children}
          <NotificationContainer />
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </CommandPaletteProvider>
      </PostHogProvider>
    );
  },
});

function useQueryClientPersister() {
  const auth = container.resolve(TOKENS.authentication);
  const [storage, setStorage] = useState(auth.session ? sessionStorage : localStorage);

  useEffect(() => {
    return auth.listen(() => setStorage(auth.session ? sessionStorage : localStorage));
  }, [auth]);

  return useMemo(() => {
    return createAsyncStoragePersister({ key: 'query-cache', storage });
  }, [storage]);
}

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
