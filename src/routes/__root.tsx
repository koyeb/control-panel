import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { z } from 'zod';

import { api } from 'src/api/api';
import { getApiQueryKey } from 'src/api/use-api';
import { PostHogProvider } from 'src/application/posthog';
import { createStorage } from 'src/application/storage';
import { NotificationContainer } from 'src/components/notification';
import { AnyFunction } from 'src/utils/types';

type EnsureQueryData = <E extends keyof typeof api>(
  endpoint: E,
  param: Parameters<(typeof api)[E]>[0],
) => ReturnType<(typeof api)[E]>;

type RouterContext = {
  queryClient: QueryClient;
  ensureQueryData: EnsureQueryData;
  auth: ReturnType<typeof getAuth>;
  breadcrumb?: () => React.ReactNode;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,

  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
  }),

  async beforeLoad({ context, search, abortController }) {
    const { queryClient } = context;
    const auth = getAuth(queryClient, search);
    const token = auth.token;

    // @ts-expect-error trust me
    const ensureQueryData: EnsureQueryData = (endpoint, param) => {
      const fn: AnyFunction = api[endpoint];

      return queryClient.ensureQueryData({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: getApiQueryKey(endpoint, param),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        queryFn: () => fn({ token, signal: abortController.signal, ...param }),
      });
    };

    if (token) {
      await Promise.all([
        ensureQueryData('getCurrentUser', {}),
        ensureQueryData('getCurrentOrganization', {}),
      ]);
    }

    return {
      auth,
      ensureQueryData,
    };
  },
});

function RootComponent() {
  return (
    <PostHogProvider>
      <Outlet />
      <NotificationContainer />
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </PostHogProvider>
  );
}

const storedAccessToken = createStorage('access-token', {
  storage: localStorage,
  parse: String,
  stringify: String,
});

const storedSessionToken = createStorage('session-token', {
  storage: sessionStorage,
  parse: String,
  stringify: String,
});

function getAuth(queryClient: QueryClient, search: { token?: string; 'session-token'?: string }) {
  const accessToken = storedAccessToken.read();
  const sessionToken = storedSessionToken.read();

  if (search.token) {
    storedAccessToken.write(search.token.replace(/^Bearer /, ''));
  }

  if (search['session-token']) {
    storedSessionToken.write(search['session-token'].replace(/^Bearer /, ''));
  }

  if (search.token || search['session-token']) {
    throw redirect({
      search: (prev) => ({ ...prev, token: undefined, 'session-token': undefined }),
      reloadDocument: true,
    });
  }

  return {
    token: sessionToken ?? accessToken,
    session: sessionToken !== null,
    setToken: async (token: string | null, session?: boolean) => {
      await queryClient.cancelQueries();
      queryClient.clear();

      if (session) {
        storedSessionToken.write(token);
      } else {
        storedAccessToken.write(token);
      }
    },
  };
}
