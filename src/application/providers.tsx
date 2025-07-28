import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider as BasePersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Component, Suspense, useEffect, useMemo } from 'react';

import { useNavigate, useSearchParams } from 'src/hooks/router';
import { CommandPaletteProvider } from 'src/modules/command-palette/command-palette.provider';
import { TOKENS } from 'src/tokens';

import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { NotificationContainer } from '../components/notification';
import { IntlProvider } from '../intl/translation-provider';

import { useSetToken } from './authentication';
import { container } from './container';
import { DialogProvider } from './dialog-context';
import { PostHogProvider } from './posthog';
import { queryClient } from './query-client';
import { reportError } from './report-error';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <RootErrorBoundary>
      <IntlProvider>
        <Suspense>
          <QueryClientProvider client={queryClient}>
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
  const config = container.resolve(TOKENS.config);
  const auth = container.resolve(TOKENS.authentication);

  const persister = useMemo(() => {
    const storage = auth.session ? window.sessionStorage : window.localStorage;

    return createAsyncStoragePersister({
      key: 'query-cache',
      storage,
    });
  }, [auth]);

  return (
    <BasePersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, buster: config.get('version') }}
    >
      {children}
    </BasePersistQueryClientProvider>
  );
}

function TokenParamsProvider({ children }: { children: React.ReactNode }) {
  const setToken = useSetToken();
  const navigate = useNavigate();

  const search = useSearchParams();
  const sessionTokenParam = search.get('session-token');
  const accessTokenParam = search.get('token');

  useEffect(() => {
    if (sessionTokenParam) {
      setToken(sessionTokenParam.replace(/^Bearer /, ''), true);
      navigate({ search: (prev) => ({ ...prev, 'session-token': null }) });
    }
  }, [sessionTokenParam, setToken, navigate]);

  useEffect(() => {
    if (accessTokenParam) {
      setToken(accessTokenParam.replace(/^Bearer /, ''));
      navigate({ search: (prev) => ({ ...prev, token: null }) });
    }
  }, [accessTokenParam, setToken, navigate]);

  if (sessionTokenParam || accessTokenParam) {
    return null;
  }

  return children;
}
