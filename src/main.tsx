import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './api/api.intercept';
import './intercom';
import './polyfills';
import './sentry';
import './styles.css';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { notify } from './application/notify';
import { PostHogProvider } from './application/posthog';
import { reportError } from './application/report-error';
import { NotificationContainer } from './components/notification';
import { IntlProvider } from './intl/translation-provider';
import { CommandPaletteProvider } from './modules/command-palette/command-palette.provider';
import { routeTree } from './route-tree.generated';
import { TOKENS } from './tokens';
import { inArray } from './utils/arrays';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }

  interface HistoryState {
    token?: string | null;
    session?: boolean;
    githubAppInstallationRequested?: boolean;
    createOrganization?: boolean;
    create?: boolean;
  }
}

const queryCache = new QueryCache({
  async onError(error, query) {
    if (error.name === 'AbortError') {
      return;
    }

    const { showError } = { showError: true, ...query.meta };
    const pathname = window.location.pathname;

    if (ApiError.is(error, 401)) {
      await handleAuthenticationError(error);
    }

    // user removed from organization
    if (ApiError.is(error, 403) && error.message === 'User is not a member of the organization') {
      await handleAuthenticationError(error);
    }

    if (
      ApiError.is(error, 404) &&
      inArray(query.queryKey[0], ['getApp', 'getService', 'getDeployment']) &&
      pathname !== '/'
    ) {
      notify.info(error.message);
      await router.navigate({ to: '/' });
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

  if (!location.pathname.startsWith('/auth')) {
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
    ensureQueryData: undefined!,
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
