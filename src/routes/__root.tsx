import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';
import { useAuth } from '@workos-inc/authkit-react';

import { ErrorComponent, NotFoundComponent } from 'src/components/error-view';
import { SeonAdapter } from 'src/hooks/seon';
import { TranslateFn } from 'src/intl/translate';

type RouterContext = {
  auth: ReturnType<typeof useAuth>;
  queryClient: QueryClient;
  seon: SeonAdapter;
  translate: TranslateFn;
  breadcrumb?: () => React.ReactNode;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
});
