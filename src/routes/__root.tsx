import { Button } from '@koyeb/design-system';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { setToken } from 'src/application/authentication';

import { PostHogProvider } from 'src/application/posthog';
import { NotificationContainer } from 'src/components/notification';
import { Translate } from 'src/intl/translate';
import { z } from 'zod';

type RouterContext = {
  queryClient: QueryClient;
  breadcrumb?: { label: () => React.ReactNode; link?: string };
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: PageNotFound,

  validateSearch: z.object({
    token: z.string().optional(),
  }),

  beforeLoad: ({ search }) => {
    if (search.token) {
      setToken(search.token.replace(/^Bearer /, ''));
      throw redirect({ search: (prev) => ({ ...prev, token: undefined }) });
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
