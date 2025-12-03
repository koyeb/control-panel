import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { useAuth } from '@workos-inc/authkit-react';
import z from 'zod';

import { setSessionToken } from 'src/application/token';
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

  validateSearch: z.object({
    'session-token': z.string().optional(),
  }),

  async beforeLoad({ search }) {
    if (search['session-token'] !== undefined) {
      setSessionToken(search['session-token'].replace(/^Bearer /, ''));
      throw redirect({ search: (prev) => ({ ...prev, 'session-token': undefined }) });
    }
  },
});
