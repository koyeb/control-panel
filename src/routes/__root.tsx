import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';

import { AuthKit } from 'src/application/authkit';
import { ErrorComponent, NotFoundComponent } from 'src/components/error-view';
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

  async beforeLoad() {
    // wait for authkit to be initialized
    await Promise.resolve();
  },
});
