import { Button } from '@koyeb/design-system';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { api } from 'src/api/api';
import { Organization, User } from 'src/api/model';
import { isSessionToken, setToken } from 'src/application/authentication';
import { getConfig } from 'src/application/config';

import { PostHogProvider } from 'src/application/posthog';
import { NotificationContainer } from 'src/components/notification';
import { Translate } from 'src/intl/translate';
import { queryClient } from 'src/main';
import { z } from 'zod';

type RouterContext = {
  queryClient: QueryClient;
  user?: User;
  organization?: Organization | null;
  breadcrumb?: { label: () => React.ReactNode; link?: string };
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: PageNotFound,

  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
    'organization-id': z.string().optional(),
  }),

  beforeLoad: async ({ context, search }) => {
    const { token, 'session-token': sessionToken, 'organization-id': organizationId } = search;

    const clearSearchParam = (param: 'token' | 'session-token' | 'organization-id') => {
      throw redirect({ search: (prev) => ({ ...prev, [param]: undefined }) });
    };

    if (token) {
      setToken(token.replace(/^Bearer /, ''));
      context.queryClient.clear();

      clearSearchParam('token');
    }

    if (sessionToken) {
      setToken(sessionToken.replace(/^Bearer /, ''), true);
      context.queryClient.clear();

      clearSearchParam('session-token');
    }

    if (organizationId) {
      const { token } = await api.switchOrganization({ path: { id: organizationId }, header: {} });

      setToken(token!.id!);
      context.queryClient.clear();

      clearSearchParam('organization-id');
    }

    if (!isSessionToken()) {
      void persistQueryClient({
        queryClient,
        buster: getConfig().version,
        persister: createSyncStoragePersister({
          key: 'query-cache',
          storage: window.localStorage,
        }),
      });
    }
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

function PageNotFound() {
  return (
    <div
      className="col absolute inset-0 items-center justify-center gap-8 bg-black/95 bg-cover bg-center bg-no-repeat px-4 py-8 text-center text-white"
      style={{ backgroundImage: 'url("/public/black-hole.svg")' }}
    >
      <div className="text-4xl md:text-6xl">
        <Translate id="pages.notFound.title" />
      </div>

      <div className="text-base">
        <Translate id="pages.notFound.line1" />
      </div>

      <Route.Link href="/" className={Button.className({ variant: 'ghost' }, 'mt-4')}>
        <Translate id="pages.notFound.back" />
      </Route.Link>
    </div>
  );
}
