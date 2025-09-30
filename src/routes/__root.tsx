import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { createEnsureApiQueryData } from 'src/api/api';
import { ApiError } from 'src/api/api-errors';
import { container } from 'src/application/container';
import { ErrorComponent, NotFoundComponent } from 'src/components/error-view';
import { SeonPort } from 'src/hooks/seon';
import { TranslateFn } from 'src/intl/translate';
import { TOKENS } from 'src/tokens';

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
    const auth = container.resolve(TOKENS.authentication);

    const setToken = async (token: string | null, session?: boolean) => {
      auth.setToken(token, session);

      if (auth.token) {
        await queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    };

    if (search.token !== undefined) {
      await setToken(search.token.replace(/^Bearer /, ''));
      throw redirect({ search: (prev) => ({ ...prev, token: undefined }) });
    }

    if (search['session-token'] !== undefined) {
      await setToken(search['session-token'].replace(/^Bearer /, ''), true);
      throw redirect({ search: (prev) => ({ ...prev, 'session-token': undefined }) });
    }
  },

  async loader({ context: { queryClient }, abortController }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient, abortController);
    const auth = container.resolve(TOKENS.authentication);

    if (auth.token) {
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
