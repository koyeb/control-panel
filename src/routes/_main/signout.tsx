import { QueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
// eslint-disable-next-line no-restricted-imports
import posthog from 'posthog-js';

import { ApiError, createEnsureApiQueryData } from 'src/api';
import { identifyUserInIntercom } from 'src/application/intercom';
import { identifyUserInSentry } from 'src/application/sentry';
import { setToken } from 'src/application/token';
import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/_main/signout')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader({ context: { authKit, queryClient } }) {
    const api = createEnsureApiQueryData(queryClient);

    if (authKit.user) {
      authKit.signOut({ navigate: true, returnTo: `${window.location.origin}/auth/signin` });
    } else {
      try {
        if (!(await isAccountLocked(queryClient))) {
          await api('delete /v1/account/logout', {});
        }
      } finally {
        setToken(null);
      }
    }

    posthog.reset();
    identifyUserInSentry(null);
    await identifyUserInIntercom(null);
  },
});

async function isAccountLocked(queryClient: QueryClient) {
  const api = createEnsureApiQueryData(queryClient);

  try {
    await api('get /v1/account/profile', {});
  } catch (error) {
    return ApiError.isAccountLockedError(error);
  }

  return false;
}
