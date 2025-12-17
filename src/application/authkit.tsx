import { QueryClient } from '@tanstack/react-query';
import { RegisteredRouter } from '@tanstack/react-router';
import {
  AuthKitProvider as BaseAuthKitProvider,
  LoginRequiredError,
  useAuth,
} from '@workos-inc/authkit-react';
import { useEffect, useState } from 'react';

import { ApiError, apiQuery } from 'src/api';
import { ErrorComponent } from 'src/components/error-view';
import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';
import { assert } from 'src/utils/assert';
import { waitFor } from 'src/utils/promises';

import { getConfig } from './config';

export type AuthKit = ReturnType<typeof useAuth>;

declare global {
  var _getAccessToken: () => Promise<string | null>;
}

globalThis._getAccessToken = () => Promise.resolve(null);

type AuthKitProviderProps = {
  router: RegisteredRouter;
  queryClient: QueryClient;
  children: (authKit: AuthKit) => React.ReactNode;
};

export function AuthKitProvider({ router, queryClient, children }: AuthKitProviderProps) {
  const clientId = getConfig('workOsClientId');
  const apiHostname = getConfig('workOsApiHost');
  const environment = getConfig('environment');

  assert(clientId !== undefined);

  const onRedirectCallback = async (next?: string) => {
    await waitForUser(queryClient);
    await router.navigate(urlToLinkOptions(next ?? '/'));
  };

  return (
    <BaseAuthKitProvider
      clientId={clientId}
      apiHostname={apiHostname}
      devMode={environment !== 'production'}
      redirectUri={`${window.location.origin}/account/workos/callback`}
      onRedirectCallback={({ state }) => void onRedirectCallback(state?.next as string | undefined)}
      onBeforeAutoRefresh={() => true}
    >
      <AuthKitGuard router={router}>{children}</AuthKitGuard>
    </BaseAuthKitProvider>
  );
}

type AuthKitGuardProps = {
  router: RegisteredRouter;
  children: (authKit: AuthKit) => React.ReactNode;
};

function AuthKitGuard({ router, children }: AuthKitGuardProps) {
  const [error, setError] = useState<unknown>(null);
  const authKit = useAuth();

  useEffect(() => {
    const onError = async (error: unknown) => {
      if (error instanceof LoginRequiredError) {
        await handleLoginRequiredError(router);
      } else {
        setError(error);
      }

      return null;
    };

    globalThis._getAccessToken = () => authKit.getAccessToken().catch(onError);
    (globalThis as { authKit?: AuthKit }).authKit = authKit;
  });

  if (error instanceof Error) {
    return <ErrorComponent error={error} reset={() => setError(null)} />;
  }

  if (authKit.isLoading) {
    return <LogoLoading />;
  }

  return children(authKit);
}

async function handleLoginRequiredError(router: RegisteredRouter) {
  const { pathname, searchStr } = router.latestLocation;

  if (!pathname.startsWith('/auth') && !pathname.startsWith('/account')) {
    const next = pathname + searchStr;

    await router.navigate({
      to: '/auth/signin',
      search: next === '/' ? undefined : { next },
    });
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function getAuthKitToken() {
  return globalThis._getAccessToken();
}

async function waitForUser(queryClient: QueryClient) {
  await waitFor(async () => {
    return queryClient.ensureQueryData(apiQuery('get /v1/account/profile', {})).then(
      () => true,
      (error) => !(ApiError.is(error) && error.status === 404),
    );
  });
}
