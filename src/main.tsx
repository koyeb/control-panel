import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './side-effects';
import './styles.css';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import qs from 'query-string';
import { StrictMode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api';
import { getConfig } from './application/config';
import { DialogProvider } from './application/dialog-context';
import { notify } from './application/notify';
import { PostHogProvider } from './application/posthog';
import { reportError } from './application/sentry';
import { accessTokenListener, getToken, isSessionToken, setToken } from './application/token';
import { NotificationContainer } from './components/notification';
import { SeonAdapter } from './hooks/seon';
import { IntlProvider, createTranslateFn } from './intl/translation-provider';
import { routeTree } from './route-tree.generated';

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

  if (getToken() !== null) {
    await setToken(null, { queryClient });
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
  if (ApiError.is(error) && Math.floor(error.status / 100) === 4) {
    return false;
  }

  return failureCount <= 3;
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
    seon: new SeonAdapter(),
    queryClient,
    translate: createTranslateFn(),
  },
  defaultOnCatch(error, errorInfo) {
    if (ApiError.is(error, 401)) {
      void handleAuthenticationError(error);
    } else {
      reportError(error, errorInfo);
    }
  },
  Wrap({ children }) {
    useEffect(() => {
      accessTokenListener((token) => {
        void setToken(token, { queryClient });
      });
    }, []);

    return (
      <IntlProvider>
        <QueryClientProvider client={queryClient}>
          <PersistQueryClient>
            <DialogProvider>{children}</DialogProvider>
          </PersistQueryClient>
        </QueryClientProvider>
      </IntlProvider>
    );
  },
  InnerWrap({ children }) {
    return (
      <PostHogProvider>
        {children}
        <NotificationContainer />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </PostHogProvider>
    );
  },
});

const persister = createAsyncStoragePersister({ key: 'query-cache', storage: localStorage });

// eslint-disable-next-line react-refresh/only-export-components
function PersistQueryClient({ children }: { children: React.ReactNode }) {
  if (isSessionToken()) {
    return children;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, buster: getConfig('version') }}
    >
      {children}
    </PersistQueryClientProvider>
  );
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
