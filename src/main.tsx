import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './api/api.intercept';
import './intercom';
import './sentry';
import './side-effects';
import './styles.css';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { notify } from './application/notify';
import { PostHogProvider } from './application/posthog';
import { reportError } from './application/report-error';
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

  interface HistoryState {
    githubAppInstallationRequested?: boolean;
    create?: boolean;
  }
}

const queryCache = new QueryCache({
  async onError(error, query) {
    if (error.name === 'AbortError') {
      return;
    }

    const { showError } = { showError: true, ...query.meta };

    if (ApiError.is(error, 401)) {
      await handleAuthenticationError(error);
    }

    // user removed from organization
    if (ApiError.is(error, 403) && error.message === 'User is not a member of the organization') {
      await handleAuthenticationError(error);
    }

    if (ApiError.is(error, 429)) {
      notify.error(error.message);
    }

    if (ApiError.is(error) && error.status >= 500) {
      notify.error(error.message);
      reportError(error);
    }

    if (!ApiError.is(error) && showError) {
      reportError(error);
      notify.error(error.message);
    }
  },
});

const mutationCache = new MutationCache({
  async onError(error, variables, context, mutation) {
    const { showError } = { showError: true, ...mutation.meta };

    if (ApiError.is(error, 401)) {
      await handleAuthenticationError(error);
    } else if (mutation.options.onError === undefined && showError) {
      notify.error(error.message);
    }
  },
});

async function handleAuthenticationError(error: Error) {
  if (ApiError.is(error) && error.message === 'Token rejected') {
    // organization is deactivated
    await router.navigate({ to: '/settings' });
    return;
  }

  const auth = container.resolve(TOKENS.authentication);

  if (auth.token !== null) {
    auth.setToken(null);
    queryClient.clear();
  }

  const location = new URL(window.location.href);

  if (!location.pathname.startsWith('/auth') && !location.pathname.startsWith('/account')) {
    const search: { next?: string } = {};

    if (location.pathname !== '/' || location.searchParams.size > 0) {
      search.next = location.href.replace(location.origin, '');
    }

    await router.navigate({
      to: '/auth/signin',
      search,
    });
  }
}

function throwOnError(error: Error) {
  return ApiError.is(error) && error.status >= 500;
}

function retry(failureCount: number, error: Error) {
  if (ApiError.is(error) && error.status >= 500) {
    return failureCount <= 3;
  }

  return false;
}

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      refetchInterval: 5_000,
      throwOnError,
      retry,
    },
    mutations: {
      throwOnError,
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
