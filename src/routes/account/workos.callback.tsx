import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { ApiError, apiQuery } from 'src/api';
import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';
import { wait } from 'src/utils/promises';

export const Route = createFileRoute('/account/workos/callback')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
  }),

  async loader({ context: { queryClient } }) {
    await waitForUser(queryClient);
    throw redirect(urlToLinkOptions(getNextUrl()));
  },
});

async function waitForUser(queryClient: QueryClient) {
  try {
    await queryClient.ensureQueryData(apiQuery('get /v1/account/profile', {}));
  } catch (error) {
    if (ApiError.is(error) && error.message === 'User id is not a uuid: ""') {
      await wait(1000);
      return waitForUser(queryClient);
    }
  }
}

function getNextUrl() {
  const next = window._next;

  delete window._next;

  if (typeof next === 'string') {
    return next;
  }

  return '/';
}
