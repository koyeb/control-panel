import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { Api } from 'src/api/api';
import { getApiQueryKey } from 'src/api/use-api';
import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';
import { AnyFunction } from 'src/utils/types';

type EnsureQueryData = <E extends keyof Api>(endpoint: E, param: Parameters<Api[E]>[0]) => ReturnType<Api[E]>;

type RouterContext = {
  queryClient: QueryClient;
  ensureQueryData: EnsureQueryData;
  breadcrumb?: () => React.ReactNode;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
  }),

  async beforeLoad({ search, context, abortController }) {
    const { queryClient } = context;
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

    const api = container.resolve(TOKENS.api);

    // @ts-expect-error trust me
    const ensureQueryData: EnsureQueryData = (endpoint, param) => {
      const fn: AnyFunction = api[endpoint];

      return queryClient.ensureQueryData({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: getApiQueryKey(endpoint, param),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        queryFn: () => fn({ signal: abortController.signal, ...param }),
      });
    };

    if (auth.token) {
      await Promise.all([
        ensureQueryData('getCurrentUser', {}),
        ensureQueryData('getCurrentOrganization', {}),
      ]);
    }

    return {
      ensureQueryData,
    };
  },
});
