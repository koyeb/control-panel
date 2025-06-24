import { Button } from '@koyeb/design-system';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorComponentProps, Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { api } from 'src/api/api';
import { isApiError } from 'src/api/api-errors';
import { setToken } from 'src/application/authentication';

import { PostHogProvider } from 'src/application/posthog';
import { ErrorLayout, ErrorView } from 'src/components/error-boundary/error-view';
import { LogoLoading } from 'src/components/logo-loading';
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
  pendingComponent: LogoLoading,
  errorComponent: ErrorComponent,
  onCatch: reportError,

  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
    'organization-id': z.string().optional(),
  }),

  beforeLoad: async ({ context, search }) => {
    const { token, 'session-token': sessionToken, 'organization-id': organizationId } = search;

    if (token) {
      setToken(token.replace(/^Bearer /, ''));
      void context.queryClient.invalidateQueries();

      throw redirect({ search: (prev) => ({ ...prev, token: undefined }) });
    }

    if (sessionToken) {
      setToken(sessionToken.replace(/^Bearer /, ''), true);
      void context.queryClient.invalidateQueries();

      throw redirect({ reloadDocument: true, search: (prev) => ({ ...prev, 'session-token': undefined }) });
    }

    if (organizationId) {
      const { token } = await api.switchOrganization({ path: { id: organizationId }, header: {} });

      setToken(token!.id!);
      void context.queryClient.invalidateQueries();

      throw redirect({ search: (prev) => ({ ...prev, 'organization-id': undefined }) });
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
    <ErrorLayout>
      <div className="text-4xl font-bold md:text-6xl">
        <Translate id="pages.notFound.title" />
      </div>

      <div className="text-base">
        <Translate id="pages.notFound.line1" />
      </div>

      <Route.Link href="/" className={Button.className({ variant: 'ghost' }, 'mt-4')}>
        <Translate id="pages.notFound.back" />
      </Route.Link>
    </ErrorLayout>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const { status, code } = isApiError(error) ? error : {};

  return <ErrorView httpStatus={status} message={error.message} code={code} onReset={reset} />;
}
