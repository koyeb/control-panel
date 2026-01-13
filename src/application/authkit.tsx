import { RegisteredRouter } from '@tanstack/react-router';
import { AuthKitProvider as BaseAuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { useEffect, useState } from 'react';

import { ErrorComponent } from 'src/components/error-view';
import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';
import { assert } from 'src/utils/assert';

import { getConfig } from './config';

export type AuthKit = ReturnType<typeof useAuth>;

declare global {
  var _getAccessToken: () => Promise<string | null>;
}

globalThis._getAccessToken = () => Promise.resolve(null);

type RedirectParams = {
  state: { next?: string } | null;
};

type AuthKitProviderProps = {
  router: RegisteredRouter;
  children: (authKit: AuthKit) => React.ReactNode;
};

export function AuthKitProvider({ router, children }: AuthKitProviderProps) {
  const clientId = getConfig('workOsClientId');
  const apiHostname = getConfig('workOsApiHost');
  const environment = getConfig('environment');

  assert(clientId !== undefined);

  const onRedirectCallback = async ({ state }: RedirectParams) => {
    await new Promise((r) => setTimeout(r, 100));
    await router.navigate(urlToLinkOptions(state?.next ?? '/'));
  };

  return (
    <BaseAuthKitProvider
      clientId={clientId}
      apiHostname={apiHostname}
      devMode={environment !== 'production'}
      redirectUri={`${window.location.origin}/account/workos/callback`}
      onRedirectCallback={(params) => void onRedirectCallback(params)}
    >
      <AuthKitGuard>{children}</AuthKitGuard>
    </BaseAuthKitProvider>
  );
}

type AuthKitGuardProps = {
  children: (authKit: AuthKit) => React.ReactNode;
};

function AuthKitGuard({ children }: AuthKitGuardProps) {
  const [error, setError] = useState<unknown>(null);
  const authKit = useAuth();

  useEffect(() => {
    globalThis._getAccessToken = () => authKit.getAccessToken();
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

// eslint-disable-next-line react-refresh/only-export-components
export function getAuthKitToken() {
  return globalThis._getAccessToken();
}
