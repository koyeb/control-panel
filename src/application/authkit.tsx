import { QueryClient } from '@tanstack/react-query';
import { RegisteredRouter } from '@tanstack/react-router';
import {
  AuthKitProvider as BaseAuthKitProvider,
  LoginRequiredError,
  useAuth,
} from '@workos-inc/authkit-react';
import { useLayoutEffect, useState } from 'react';

import { ErrorComponent } from 'src/components/error-view';
import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';
import { assert } from 'src/utils/assert';

import { getConfig } from './config';

// eslint-disable-next-line react-refresh/only-export-components
export const workOsQueryClient = new QueryClient();

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

  const onRedirectCallback = ({ state }: RedirectParams) => {
    void router.navigate({ ...urlToLinkOptions(state?.next ?? '/'), reloadDocument: true });
  };

  return (
    <BaseAuthKitProvider
      clientId={clientId}
      apiHostname={apiHostname}
      devMode={environment !== 'production'}
      redirectUri={`${window.location.origin}/account/workos/callback`}
      onRedirectCallback={onRedirectCallback}
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

  useLayoutEffect(() => {
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
