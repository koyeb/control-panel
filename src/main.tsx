import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './intercom';
import './polyfills';
import './sentry';
import './styles.css';

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import qs from 'query-string';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api/api-errors';
import { notify } from './application/notify';
import { Providers } from './application/providers';
import { routeTree } from './route-tree.generated';
import { inArray } from './utils/arrays';

declare global {
  interface Window {
    router: typeof router;
    queryClient: typeof queryClient;
  }
}

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
  onError(error, query) {
    if (error.name === 'AbortError') {
      return;
    }

    const { showError } = { showError: true, ...query.meta };
    const pathname = window.location.pathname;

    if (ApiError.is(error, 401)) {
      void handleAuthenticationError(error);
    }

    if (
      ApiError.is(error, 404) &&
      inArray(query.queryKey[0], ['getApp', 'getService', 'getDeployment']) &&
      pathname !== '/'
    ) {
      notify.info(error.message);
      void router.navigate({ to: '/' });
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
  onError(error, variables, context, mutation) {
    if (ApiError.is(error, 401)) {
      void handleAuthenticationError(error);
    } else if (mutation.options.onError === undefined) {
      notify.error(error.message);
    }
  },
});

function handleAuthenticationError(error: Error) {
  if (error.message === 'Token rejected') {
    // organization is deactivated
    return router.navigate({ to: '/settings' });
  }

  const location = new URL(window.location.href);
  const search: { next?: string } = {};

  if (location.pathname !== '/' && !location.pathname.startsWith('/auth')) {
    search.next = location.href.replace(location.origin, '');
  }

  sessionStorage.removeItem('session-token');
  localStorage.removeItem('access-token');

  return router.navigate({
    to: '/auth/signin',
    search,
  });
}

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      refetchInterval: 5_000,
      retry: (retryCount, error) => {
        if (error instanceof ApiError && error.status >= 500) {
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
    auth: undefined!,
    ensureQueryData: undefined!,
  },
});

window.router = router;
window.queryClient = queryClient;

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <Providers queryClient={queryClient}>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
}
