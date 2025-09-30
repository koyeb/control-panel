import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { ApiError, createEnsureApiQueryData } from 'src/api';
import { getToken, setToken } from 'src/application/token';
import { ErrorComponent, NotFoundComponent } from 'src/components/error-view';
import { SeonPort } from 'src/hooks/seon';
import { TranslateFn } from 'src/intl/translate';

type RouterContext = {
  seon: SeonPort;
  queryClient: QueryClient;
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

  async beforeLoad({ context: { queryClient }, search }) {
    if (search.token !== undefined) {
      await setToken(search.token.replace(/^Bearer /, ''), { queryClient });
      throw redirect({ search: (prev) => ({ ...prev, token: undefined }) });
    }

    if (search['session-token'] !== undefined) {
      await setToken(search['session-token'].replace(/^Bearer /, ''), { queryClient, session: true });
      throw redirect({ search: (prev) => ({ ...prev, 'session-token': undefined }) });
    }
  },

  async loader({ context: { queryClient }, abortController }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient, abortController);

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
