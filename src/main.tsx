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
import { StrictMode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api';
import { ApiEndpoint } from './api/api';
import { AuthKitAdapter } from './application/authkit';
import { getConfig } from './application/config';
import { notify } from './application/notify';
import { PostHogProvider } from './application/posthog';
import { reportError } from './application/sentry';
import {
  accessTokenListener,
  getToken,
  isSessionToken,
  setAuthKitToken,
  setToken,
} from './application/token';
import { ConfirmationDialog } from './components/confirmation-dialog';
import { closeDialog } from './components/dialog';
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

    if (ApiError.is(error, 401) && query.queryKey[0] === ('get /v1/account/profile' satisfies ApiEndpoint)) {
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

  if (authKit.user) {
    setAuthKitToken(null);
    authKit.signOut();
    queryClient.clear();
  } else if (getToken() !== null) {
    setToken(null);
    queryClient.clear();
  }

  const location = new URL(window.location.href);

  if (!location.pathname.startsWith('/auth') && !location.pathname.startsWith('/account')) {
    const href = new URL('/auth/signin', window.location.origin);

    if (location.pathname !== '/' || location.searchParams.size > 0) {
      href.searchParams.set('next', location.href.replace(location.origin, ''));
    }

    window.location.href = href.toString();
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

const seon = new SeonAdapter();

const authKit = new AuthKitAdapter();

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
    seon,
    authKit,
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
      return accessTokenListener((token) => {
        setToken(token);
        void queryClient.invalidateQueries();
      });
    }, []);

    return (
      <AuthKitProvider>
        <IntlProvider>
          <QueryClientProvider client={queryClient}>
            <PersistQueryClient>{children}</PersistQueryClient>
          </QueryClientProvider>
        </IntlProvider>
      </AuthKitProvider>
    );
  },
  InnerWrap({ children }) {
    useEffect(() => {
      return router.subscribe('onBeforeNavigate', () => closeDialog(true));
    }, []);

    return (
      <PostHogProvider>
        {children}
        <NotificationContainer />
        <ConfirmationDialog />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </PostHogProvider>
    );
  },
});

// eslint-disable-next-line react-refresh/only-export-components
function AuthKitProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      await authKit.initialize();

      if (authKit.user) {
        setAuthKitToken(await authKit.getAccessToken());
      }
    }

    const id = setTimeout(() => {
      initialize()
        .catch(reportError)
        .finally(() => setLoading(false));
    });

    return () => {
      clearTimeout(id);
    };
  }, []);

  return loading ? null : children;
}

const persister = createAsyncStoragePersister({ key: 'query-cache', storage: localStorage });

// eslint-disable-next-line react-refresh/only-export-components
function PersistQueryClient({ children }: { children: React.ReactNode }) {
  const location = new URL(window.location.href);

  if (isSessionToken() || location.searchParams.has('session-token')) {
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
