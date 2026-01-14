import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './side-effects';
import './styles.css';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { LoginRequiredError } from '@workos-inc/authkit-react';
import qs from 'query-string';
import { StrictMode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api';
import { AuthKitProvider } from './application/authkit';
import { notify } from './application/notify';
import { PostHogProvider } from './application/posthog';
import { reportError } from './application/sentry';
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
    next?: string;
    githubAppInstallationRequested?: boolean;
    expandedSection?: ServiceFormSection;
    create?: boolean;
  }
}

window.indexedDB.deleteDatabase('tanstack-query');

const queryCache = new QueryCache({
  onError(error, query) {
    if (error.name === 'AbortError') {
      return;
    }

    const { showError } = { showError: true, ...query.meta };

    if (error instanceof LoginRequiredError) {
      void router.navigate({ to: '/auth/signin' });
      return;
    }

    if (ApiError.is(error) && error.message === 'Token rejected') {
      // organization is deactivated
      void router.navigate({ to: '/settings' });
      return;
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
  async onError(error, variables, context, mutation) {
    const { showError } = { showError: true, ...mutation.meta };

    if (mutation.options.onError === undefined && showError) {
      notify.error(error.message);
    }
  },
});

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

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
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
    authKit: undefined!,
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

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <AuthKitProvider router={router} queryClient={queryClient}>
        {(authKit) => <RouterProvider router={router} context={{ authKit }} />}
      </AuthKitProvider>
    </StrictMode>,
  );
}
