import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider as BasePersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Component, Suspense, useEffect, useMemo } from 'react';

import { useSearchParam } from 'src/hooks/router';
import { CommandPaletteProvider } from 'src/modules/command-palette/command-palette.provider';

import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { NotificationContainer } from '../components/notification';
import { IntlProvider } from '../intl/translation-provider';

import { getConfig } from './config';
import { DialogProvider } from './dialog-context';
import { PostHogProvider } from './posthog';
import { createQueryClient } from './query-client';
import { reportError } from './report-error';
import { TokenProvider, useToken } from './token';

const queryClient = createQueryClient();

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <RootErrorBoundary>
      <IntlProvider>
        <Suspense>
          <QueryClientProvider client={queryClient}>
            <TokenProvider>
              <PersistQueryClientProvider>
                <TokenParamsProvider>
                  <PostHogProvider>
                    <DialogProvider>
                      <CommandPaletteProvider>
                        <ReactQueryDevtools />
                        <NotificationContainer />
                        <ErrorBoundary>{children}</ErrorBoundary>
                      </CommandPaletteProvider>
                    </DialogProvider>
                  </PostHogProvider>
                </TokenParamsProvider>
              </PersistQueryClientProvider>
            </TokenProvider>
          </QueryClientProvider>
        </Suspense>
      </IntlProvider>
    </RootErrorBoundary>
  );
}

class RootErrorBoundary extends Component<{ children: React.ReactNode }> {
  state: { error: Error | null } = { error: null };

  componentDidCatch(error: Error): void {
    reportError(error);
    this.setState({ error });
  }

  render(): React.ReactNode {
    const { error } = this.state;

    if (error) {
      return error.message;
    }

    return this.props.children;
  }
}

function PersistQueryClientProvider({ children }: { children: React.ReactNode }) {
  const { version } = getConfig();
  const { session } = useToken();

  const persister = useMemo(() => {
    const storage = session ? window.sessionStorage : window.localStorage;

    return createSyncStoragePersister({
      key: 'query-cache',
      storage,
    });
  }, [session]);

  return (
    <BasePersistQueryClientProvider client={queryClient} persistOptions={{ persister, buster: version }}>
      {children}
    </BasePersistQueryClientProvider>
  );
}

function TokenParamsProvider({ children }: { children: React.ReactNode }) {
  const [sessionTokenParam, setSessionTokenParam] = useSearchParam('session-token');
  const [accessTokenParam, setAccessTokenParam] = useSearchParam('token');
  const { setToken } = useToken();

  useEffect(() => {
    if (sessionTokenParam) {
      setToken(sessionTokenParam.replace(/^Bearer /, ''), true);
      setSessionTokenParam(null);
    }
  }, [sessionTokenParam, setSessionTokenParam, setToken]);

  useEffect(() => {
    if (accessTokenParam) {
      setToken(accessTokenParam.replace(/^Bearer /, ''));
      setAccessTokenParam(null);
    }
  }, [accessTokenParam, setAccessTokenParam, setToken]);

  if (sessionTokenParam || accessTokenParam) {
    return null;
  }

  return children;
}
