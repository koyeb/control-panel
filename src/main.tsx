import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './api/api.intercept';
import './intercom';
import './sentry';
import './side-effects';
import './styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import qs from 'query-string';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { ApiError } from './api/api-errors';
import { DialogProvider } from './application/dialog-context';
import { PostHogProvider } from './application/posthog';
import { LogoLoading } from './components/logo-loading';
import { NotificationContainer } from './components/notification';
import { IntlProvider, createTranslateFn } from './intl/translation-provider';
import { CommandPaletteProvider } from './modules/command-palette';
import { routeTree } from './route-tree.generated';

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
  defaultPendingComponent: LogoLoading,
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
    return (
      <IntlProvider>
        <QueryClientProvider client={queryClient}>
          <DialogProvider>{children}</DialogProvider>
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

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
