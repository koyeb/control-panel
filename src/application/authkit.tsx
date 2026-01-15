import { QueryClient } from '@tanstack/react-query';
import { AuthKitProvider as BaseAuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { useEffect } from 'react';

import { assert } from 'src/utils/assert';

import { getConfig } from './config';

export type AuthKit = ReturnType<typeof useAuth>;

type RedirectParams = {
  state: { next?: string } | null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const workOsQueryClient = new QueryClient();

type AuthKitProviderProps = {
  queryClient: QueryClient;
  children: (authKit: AuthKit) => React.ReactNode;
};

export function AuthKitProvider({ queryClient, children }: AuthKitProviderProps) {
  const clientId = getConfig('workOsClientId');
  const apiHostname = getConfig('workOsApiHost');
  const environment = getConfig('environment');

  assert(clientId !== undefined);

  const onRedirectCallback = async ({ state }: RedirectParams) => {
    window.location.href = state?.next ?? '/';
  };

  return (
    <BaseAuthKitProvider
      clientId={clientId}
      apiHostname={apiHostname}
      devMode={environment !== 'production'}
      redirectUri={`${window.location.origin}/account/workos/callback`}
      onRedirectCallback={(params) => void onRedirectCallback(params)}
    >
      <AuthKitGuard queryClient={queryClient}>{children}</AuthKitGuard>
    </BaseAuthKitProvider>
  );
}

type AuthKitGuardProps = {
  queryClient: QueryClient;
  children: (authKit: AuthKit) => React.ReactNode;
};

function AuthKitGuard({ queryClient, children }: AuthKitGuardProps) {
  const authKit = useAuth();

  useEffect(() => {
    const meta = { getAccessToken: authKit.getAccessToken };
    const options = queryClient.getDefaultOptions();

    queryClient.setDefaultOptions({
      ...options,
      queries: { ...options.queries, meta },
      mutations: { ...options.mutations, meta },
    });
  });

  if (authKit.isLoading) {
    return null;
  }

  return children(authKit);
}
