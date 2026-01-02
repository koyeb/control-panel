import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';
import { waitFor } from '@testing-library/react';

import { AuthKit } from 'src/application/authkit';
import { ErrorComponent, NotFoundComponent } from 'src/components/error-view';
import { LogoLoading } from 'src/components/logo-loading';
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
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  pendingComponent: PendingComponent,

  async beforeLoad({ context: { authKit } }) {
    await waitFor(() => !authKit.isLoading, { interval: 0 });
  },
});

function PendingComponent() {
  return <LogoLoading />;
}
