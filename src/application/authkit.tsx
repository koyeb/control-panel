import { QueryClient } from '@tanstack/react-query';
import { NavigateFn } from '@tanstack/react-router';
import { LoginRequiredError } from '@workos-inc/authkit-js';
import { AuthKitProvider as BaseAuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { useEffect } from 'react';

import { ApiError, apiQuery } from 'src/api';
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
  navigate: NavigateFn;
  queryClient: QueryClient;
};

export function AuthKitProvider({
  navigate,
  queryClient,
  ...props
}: AuthKitProviderProps & AuthKitGuardProps) {
  const clientId = getConfig('workOsClientId');
  const apiHostname = getConfig('workOsApiHost');
  const environment = getConfig('environment');

  assert(clientId !== undefined);

  const onRedirectCallback = async (next?: string) => {
    await waitForUser(queryClient);
    await navigate(urlToLinkOptions(next ?? '/'));
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
      <AuthKitGuard {...props} />
    </BaseAuthKitProvider>
  );
}

type AuthKitGuardProps = {
  onLoginRequired: () => Promise<void>;
  children: (authKit: AuthKit) => React.ReactNode;
};

function AuthKitGuard({ onLoginRequired, children }: AuthKitGuardProps) {
  const authKit = useAuth();

  useEffect(() => {
    const onError = async (error: unknown) => {
      if (error instanceof LoginRequiredError) {
        await onLoginRequired();
        return null;
      } else {
        throw error;
      }
    };

    globalThis._getAccessToken = () => authKit.getAccessToken().catch(onError);
    (globalThis as { authKit?: AuthKit }).authKit = authKit;
  });

  if (authKit.isLoading) {
    return <LogoLoading />;
  }

  return children(authKit);
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
