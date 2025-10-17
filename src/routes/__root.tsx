import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { ApiError, createEnsureApiQueryData } from 'src/api';
import { AuthKitAdapter } from 'src/application/authkit';
import { getToken, setToken } from 'src/application/token';
import { ErrorComponent, NotFoundComponent } from 'src/components/error-view';
import { SeonAdapter } from 'src/hooks/seon';
import { TranslateFn } from 'src/intl/translate';

type RouterContext = {
  queryClient: QueryClient;
  seon: SeonAdapter;
  authKit: AuthKitAdapter;
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

  async loader({ context: { queryClient } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    if (getToken()) {
      await Promise.all([
        ensureApiQueryData('get /v1/account/profile', {}),
        ensureApiQueryData('get /v1/account/organization', {}).catch((error) => {
          if (ApiError.is(error, 404)) {
            return;
          }

          throw error;
        }),
      ]).catch(() => {});
    }
  },
});
