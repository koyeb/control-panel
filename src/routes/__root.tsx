import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { ApiPort, api } from 'src/api/api';
import { getApiQueryKey } from 'src/api/use-api';
import { container } from 'src/application/container';
import { ErrorComponent } from 'src/components/error-view';
import { TOKENS } from 'src/tokens';
import { AnyFunction } from 'src/utils/types';

type EnsureQueryData = <E extends keyof ApiPort>(
  endpoint: E,
  param: Parameters<ApiPort[E]>[0],
) => ReturnType<ApiPort[E]>;

type RouterContext = {
  queryClient: QueryClient;
  ensureQueryData: EnsureQueryData;
  breadcrumb?: () => React.ReactNode;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  errorComponent: ErrorComponent,

  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
  }),

  async beforeLoad({ search, location, context, abortController }) {
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

    if (location.state.token !== undefined) {
      await setToken(location.state.token, location.state.session);
    }

    // @ts-expect-error trust me
    const ensureQueryData: EnsureQueryData = (endpoint, param) => {
      const fn: AnyFunction = api()[endpoint];

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
