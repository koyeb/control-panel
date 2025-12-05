import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { AuthKit } from 'src/application/authkit';
import { setToken } from 'src/application/token';
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

  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
  }),

  async beforeLoad({ search }) {
    if (search.token !== undefined) {
      setToken(search.token.replace(/^Bearer /, ''));
      throw redirect({ search: (prev) => ({ ...prev, token: undefined }) });
    }

    if (search['session-token'] !== undefined) {
      setToken(search['session-token'].replace(/^Bearer /, ''), true);
      throw redirect({ search: (prev) => ({ ...prev, 'session-token': undefined }) });
    }
  },
});
