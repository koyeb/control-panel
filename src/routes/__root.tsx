import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext, useRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';

import { AuthKit } from 'src/application/authkit';
import { PostHogProvider } from 'src/application/posthog';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { closeDialog } from 'src/components/dialog';
import { ErrorComponent, NotFoundComponent } from 'src/components/error-view';
import { NotificationContainer } from 'src/components/notification';
import { SeonAdapter } from 'src/hooks/seon';
import { TranslateFn } from 'src/intl/translate';

type RouterContext = {
  queryClient: QueryClient;
  seon: SeonAdapter;
  authKit: AuthKit;
  translate: TranslateFn;
  breadcrumb?: () => React.ReactNode;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Component,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,

  // wait for the authkit client to be provided
  async beforeLoad() {},
});

function Component() {
  const router = useRouter();

  useEffect(() => {
    return router.subscribe('onBeforeNavigate', () => closeDialog(true));
  }, [router]);

  return (
    <PostHogProvider>
      <Outlet />
      <NotificationContainer />
      <ConfirmationDialog />
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </PostHogProvider>
  );
}
