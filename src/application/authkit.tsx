import { QueryClient } from '@tanstack/react-query';
import {
  AuthKitProvider as BaseAuthKitProvider,
  useAuth as useWorkOsAuth,
} from '@workos-inc/authkit-react';
import { createContext, useContext, useEffect } from 'react';

import { assert } from 'src/utils/assert';

import { getConfig } from './config';

export type AuthKit = ReturnType<typeof useWorkOsAuth>;

const noOpAuthKit: AuthKit = {
  isLoading: false,
  user: undefined,
  role: undefined,
  permissions: undefined,
  entitlements: undefined,
  organizationId: undefined,
  impersonator: undefined,
  sessionId: '',
  getAccessToken: () => Promise.resolve(''),
  signIn: () => Promise.resolve(undefined),
  signUp: () => Promise.resolve(undefined),
  signOut: () => {},
  switchToOrganization: () => Promise.resolve(undefined),
};

const AuthContext = createContext<AuthKit>(noOpAuthKit);

export function useAuth(): AuthKit {
  return useContext(AuthContext);
}

type RedirectParams = {
  state: { next?: string } | null;
};

type AuthKitProviderProps = {
  queryClient: QueryClient;
  children: (authKit: AuthKit) => React.ReactNode;
};

export function AuthKitProvider({ queryClient, children }: AuthKitProviderProps) {
  const clientId = getConfig('workOsClientId');

  if (!clientId) {
    return <NoAuthProvider queryClient={queryClient}>{children}</NoAuthProvider>;
  }

  return <WorkOsAuthKitProvider queryClient={queryClient}>{children}</WorkOsAuthKitProvider>;
}

function NoAuthProvider({ queryClient, children }: AuthKitProviderProps) {
  useEffect(() => {
    const meta = { getAccessToken: noOpAuthKit.getAccessToken };
    const options = queryClient.getDefaultOptions();

    queryClient.setDefaultOptions({
      ...options,
      queries: { ...options.queries, meta },
      mutations: { ...options.mutations, meta },
    });
  });

  return <AuthContext.Provider value={noOpAuthKit}>{children(noOpAuthKit)}</AuthContext.Provider>;
}

function WorkOsAuthKitProvider({ queryClient, children }: AuthKitProviderProps) {
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
  const authKit = useWorkOsAuth();

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

  return <AuthContext.Provider value={authKit}>{children(authKit)}</AuthContext.Provider>;
}
