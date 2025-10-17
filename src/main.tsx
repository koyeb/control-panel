import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './side-effects';
import './styles.css';

import {
  PersistedQuery,
  experimental_createQueryPersister as createQueryPersister,
} from '@tanstack/query-persist-client-core';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import qs from 'query-string';
import { StrictMode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api';
import { ApiEndpoint } from './api/api';
import { AuthKitAdapter } from './application/authkit';
import { getConfig } from './application/config';
import { IndexDBAdapter } from './application/index-db';
import { notify } from './application/notify';
import { PostHogProvider } from './application/posthog';
import { reportError } from './application/sentry';
import { accessTokenListener, getToken, setAuthKitToken, setToken } from './application/token';
import { configureZod } from './application/validation';
import { ConfirmationDialog } from './components/confirmation-dialog';
import { closeDialog } from './components/dialog';
import { NotificationContainer } from './components/notification';
import { SeonAdapter } from './hooks/seon';
import { IntlProvider, createTranslateFn } from './intl/translation-provider';
import { ServiceFormSection } from './modules/service-form';
import { routeTree } from './route-tree.generated';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }

  interface HistoryState {
    clearCache?: boolean;
    githubAppInstallationRequested?: boolean;
    expandedSection?: ServiceFormSection;
    create?: boolean;
  }
}

const queryCache = new QueryCache({
  async onError(error, query) {
    if (error.name === 'AbortError') {
      return;
    }

    const { showError } = { showError: true, ...query.meta };

    if (ApiError.is(error) && error.message === 'Token rejected') {
      // organization is deactivated
      await router.navigate({ to: '/settings' });
      return;
    }

    if (ApiError.is(error, 401) && query.queryKey[0] === ('get /v1/account/profile' satisfies ApiEndpoint)) {
      await handleAuthenticationError();
    }

    // user removed from organization
    if (ApiError.is(error, 403) && error.message === 'User is not a member of the organization') {
      await handleAuthenticationError();
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
  async onSuccess(data, variables, onMutateResult, mutation) {
    const keys = new Array<unknown>(
      'logout', // authkit logout
      'delete /v1/account/logout',
      'delete /v1/organizations/{id}',
      'delete /v1/users/{id}',
      'delete /v2/users/{id}',
    );

    if (keys.includes(mutation.options.mutationKey?.[0])) {
      await persistStore.clear();
      queryClient.clear();
    }
  },
  async onError(error, variables, context, mutation) {
    const { showError } = { showError: true, ...mutation.meta };

    if (ApiError.is(error, 401)) {
      await handleAuthenticationError();
    } else if (mutation.options.onError === undefined && showError) {
      notify.error(error.message);
    }
  },
});

async function handleAuthenticationError() {
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
    const search: { next?: string } = {};

    if (location.pathname !== '/' || location.searchParams.size > 0) {
      search.next = location.href.replace(location.origin, '');
    }

    await router.navigate({
      to: '/auth/signin',
      search,
      reloadDocument: true,
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

const seon = new SeonAdapter();

const authKit = new AuthKitAdapter();

const persistStore = new IndexDBAdapter('tanstack-query', 'cache');

const persister = createQueryPersister({
  maxAge: 1000 * 60 * 60 * 24 * 2, // 48 hours
  buster: getConfig('version'),
  prefix: 'query',
  serialize: (value) => value,
  deserialize: (value) => value as PersistedQuery,
  storage: persistStore,
});

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      persister: persister.persisterFn,
      refetchInterval: 5_000,
      throwOnError,
      retry,
    },
    mutations: {
      throwOnError,
    },
  },
});

const translate = createTranslateFn();

configureZod(translate);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultOnCatch: reportError,
  parseSearch: qs.parse,
  stringifySearch: (value) => {
    const result = qs.stringify(value);
    return result !== '' ? `?${result}` : '';
  },
  context: {
    queryClient,
    seon,
    authKit,
    translate,
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
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </IntlProvider>
      </AuthKitProvider>
    );
  },
  InnerWrap({ children }) {
    useEffect(() => {
      return router.subscribe('onBeforeNavigate', () => closeDialog(true));
    }, []);

    useEffect(() => {
      router.subscribe('onBeforeRouteMount', ({ toLocation }) => {
        if (toLocation.pathname.startsWith('/auth') || toLocation.state.clearCache) {
          queryClient.clear();
          void persistStore.clear();
        }

        if (toLocation.state.clearCache) {
          void router.navigate({ state: {} });
        }
      });
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

// eslint-disable-next-line react-refresh/only-export-components
function PersistGate({ children }: { children: React.ReactNode }) {
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    localStorage.removeItem('query-cache');
    void persister.restoreQueries(queryClient).finally(() => setRestoring(false));
  }, []);

  if (restoring) {
    return null;
  }

  return children;
}

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <PersistGate>
        <RouterProvider router={router} />
      </PersistGate>
    </StrictMode>,
  );
}
