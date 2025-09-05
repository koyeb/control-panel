import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider as BasePersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthKitProvider as BaseAuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { Component, Suspense, useMemo } from 'react';

import { CommandPaletteProvider } from 'src/modules/command-palette/command-palette.provider';
import { TOKENS } from 'src/tokens';
import { AssertionError, assert } from 'src/utils/assert';

import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { NotificationContainer } from '../components/notification';
import { IntlProvider } from '../intl/translation-provider';

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
          <AuthKitProvider>
            <QueryClientProvider client={queryClient}>
              <PersistQueryClientProvider>
                <PostHogProvider>
                  <DialogProvider>
                    <CommandPaletteProvider>
                      <ReactQueryDevtools />
                      <NotificationContainer />
                      <ErrorBoundary>{children}</ErrorBoundary>
                    </CommandPaletteProvider>
                  </DialogProvider>
                </PostHogProvider>
              </PersistQueryClientProvider>
            </QueryClientProvider>
          </AuthKitProvider>
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

function AuthKitProvider({ children }: { children: React.ReactNode }) {
  const config = container.resolve(TOKENS.config);
  const environment = config.get('environment');
  const clientId = config.get('workOsClientId');

  assert(clientId !== undefined, new AssertionError('Missing WorkOS client id'));

  return (
    <BaseAuthKitProvider
      devMode={environment === 'development'}
      redirectUri={`${window.location.origin}/account/workos/callback`}
      clientId={clientId}
    >
      <InjectWorkOs />
      {children}
    </BaseAuthKitProvider>
  );
}

function InjectWorkOs() {
  container.bindValue(TOKENS.workOs, useAuth());
  return null;
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
