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
import { LoginRequiredError } from '@workos-inc/authkit-js';
import { AuthKitProvider as BaseAuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import qs from 'query-string';
import { StrictMode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api';
import { ApiEndpoint } from './api/api';
import { getConfig } from './application/config';
import { IndexDBAdapter } from './application/index-db';
import { notify } from './application/notify';
import { PostHogProvider } from './application/posthog';
import { reportError } from './application/sentry';
import { setGetAccessToken } from './application/token';
import { configureZod } from './application/validation';
import { ConfirmationDialog } from './components/confirmation-dialog';
import { closeDialog } from './components/dialog';
import { LogoLoading } from './components/logo-loading';
import { NotificationContainer } from './components/notification';
import { SeonAdapter } from './hooks/seon';
import { IntlProvider, createTranslateFn } from './intl/translation-provider';
import { ServiceFormSection } from './modules/service-form';
import { routeTree } from './route-tree.generated';
import { assert } from './utils/assert';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }

  interface HistoryState {
    next?: string;
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
      void router.navigate({ to: '/settings' });
      return;
    }

    if (ApiError.is(error, 401) && query.queryKey[0] === ('get /v1/account/profile' satisfies ApiEndpoint)) {
      await handleAuthenticationError();
    }

    // user removed from organization
    if (ApiError.is(error, 403) && error.message === 'User is not a member of the organization') {
      await handleAuthenticationError();
    }

    if (ApiError.is(error, 404)) {
      queryClient.setQueriesData({ queryKey: query.queryKey, exact: true }, undefined);
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
      'delete /v1/organizations/{id}',
      'delete /v1/organization_members/{id}',
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
  const href = router.latestLocation.href;

  if (href.startsWith('/auth') || href.startsWith('/account')) {
    return;
  }

  await persistStore.clear();

  await router.navigate({
    to: '/auth/signin',
    state: { next: href === '/' ? undefined : href },
  });
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

const persistStore = new IndexDBAdapter('tanstack-query', 'cache');

const persister = createQueryPersister({
  maxAge: 1000 * 60 * 60 * 24 * 2, // 48 hours
  buster: getConfig('version'),
  prefix: 'query',
  serialize: (value) => value,
  deserialize: (value) => value as PersistedQuery,
  storage: persistStore,
});

const location = new URL(window.location.href);
const disablePersist = location.searchParams.has('session-token');

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      persister: !disablePersist ? persister.persisterFn : undefined,
      refetchInterval: (query) => (query.state.error === null ? 5_000 : false),
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
    auth: undefined!,
    queryClient,
    seon,
    translate,
  },
  Wrap({ children }) {
    return (
      <IntlProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </IntlProvider>
    );
  },
  InnerWrap({ children }) {
    useEffect(() => {
      return router.subscribe('onBeforeNavigate', () => closeDialog(true));
    }, []);

    useEffect(() => {
      router.subscribe('onBeforeRouteMount', ({ toLocation }) => {
        if (toLocation.state.clearCache) {
          queryClient.clear();
          void persistStore.clear();
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

declare global {
  interface Window {
    _next?: unknown;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function AuthKitProvider({ children }: { children: React.ReactNode }) {
  const clientId = getConfig('workOsClientId');
  const apiHostname = getConfig('workOsApiHost');
  const environment = getConfig('environment');

  assert(clientId !== undefined);

  return (
    <BaseAuthKitProvider
      clientId={clientId}
      apiHostname={apiHostname}
      devMode={environment !== 'production'}
      redirectUri={`${window.location.origin}/account/workos/callback`}
      onBeforeAutoRefresh={() => true}
      onRedirectCallback={({ state }) => (window._next = state?.next as string)}
    >
      {children}
    </BaseAuthKitProvider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function AuthKitConsumer({ children }: { children: (auth: ReturnType<typeof useAuth>) => React.ReactNode }) {
  const auth = useAuth();

  const onError = async (error: unknown) => {
    if (error instanceof LoginRequiredError) {
      await handleAuthenticationError();
    }

    throw error;
  };

  useEffect(() => {
    setGetAccessToken(() => auth.getAccessToken().catch(onError));
  });

  if (auth.isLoading) {
    return <LogoLoading />;
  }

  return children(auth);
}

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <AuthKitProvider>
        <AuthKitConsumer>{(auth) => <RouterProvider router={router} context={{ auth }} />}</AuthKitConsumer>
      </AuthKitProvider>
    </StrictMode>,
  );
}
