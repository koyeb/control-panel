import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

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

  async beforeLoad({ context, abortController }) {
    const { queryClient } = context;
    const auth = getAuth(queryClient);
    const token = auth.token;

    // @ts-expect-error trust me
    const ensureQueryData: EnsureQueryData = (endpoint, param) => {
      const fn: AnyFunction = api[endpoint];

      return queryClient.ensureQueryData({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: getApiQueryKey(endpoint, param),
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

function getAuth(queryClient: QueryClient) {
  const accessToken = storedAccessToken.read();
  const sessionToken = storedSessionToken.read();

  return {
    token: sessionToken ?? accessToken,
    session: sessionToken !== null,
    async setToken(token: string | null, session?: boolean) {
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
