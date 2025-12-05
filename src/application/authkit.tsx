import { QueryClient } from '@tanstack/react-query';
import { NavigateFn } from '@tanstack/react-router';
import { LoginRequiredError } from '@workos-inc/authkit-js';
import { AuthKitProvider as BaseAuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { useEffect } from 'react';

import { ApiError, apiQuery } from 'src/api';
import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';
import { assert } from 'src/utils/assert';
import { wait } from 'src/utils/promises';

import { getConfig } from './config';

export type AuthKit = ReturnType<typeof useAuth>;

declare global {
  var _getAccessToken: () => Promise<string | null>;
}

globalThis._getAccessToken = () => Promise.resolve(null);

type AuthKitProviderProps = {
  navigate: NavigateFn;
  queryClient: QueryClient;
  onLoginRequired: () => Promise<void>;
  children: (authKit: AuthKit) => React.ReactNode;
};

export function AuthKitProvider(props: AuthKitProviderProps) {
  const clientId = getConfig('workOsClientId');
  const apiHostname = getConfig('workOsApiHost');
  const environment = getConfig('environment');

  assert(clientId !== undefined);

  return (
    <BaseAuthKitProvider
      clientId={clientId}
      apiHostname={apiHostname}
      devMode={environment !== 'production'}
      redirectUri={`${window.location.origin}/account/workos/callback`}
      onRedirectCallback={void redirectCallback(props.navigate, props.queryClient)}
      onBeforeAutoRefresh={() => true}
    >
      <AuthKitGuard {...props} />
    </BaseAuthKitProvider>
  );
}

function AuthKitGuard({ onLoginRequired, children }: AuthKitProviderProps) {
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
export function getAccessToken() {
  return globalThis._getAccessToken();
}

function redirectCallback(navigate: NavigateFn, queryClient: QueryClient) {
  return async ({ state }: { state: Record<string, unknown> | null }) => {
    const next = state?.next as string | undefined;

    await waitForUser(queryClient);
    await navigate(urlToLinkOptions(next ?? '/'));
  };
}

async function waitForUser(queryClient: QueryClient) {
  try {
    await queryClient.ensureQueryData(apiQuery('get /v1/account/profile', {}));
  } catch (error) {
    if (ApiError.is(error) && shouldRetry(error)) {
      await wait(1000);
      return waitForUser(queryClient);
    }
  }
}

function shouldRetry(error: ApiError) {
  return error.status === 404 || error.message === 'User id is not a uuid: ""';
}
