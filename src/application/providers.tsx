import { QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Component, Suspense, useMemo } from 'react';

import { CommandPaletteProvider } from 'src/modules/command-palette/command-palette.provider';

import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { NotificationContainer } from '../components/notification';
import { IntlProvider } from '../intl/translation-provider';

import { DialogProvider } from './dialog-context';
import { PostHogProvider } from './posthog';
import { createQueryClient } from './query-client';
import { reportError } from './report-error';
import { TokenProvider, useToken } from './token';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <RootErrorBoundary>
      <IntlProvider>
        <Suspense>
          <TokenProvider>
            <QueryClientProvider>
              <PostHogProvider>
                <DialogProvider>
                  <CommandPaletteProvider>
                    <ReactQueryDevtools />
                    <NotificationContainer />
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </CommandPaletteProvider>
                </DialogProvider>
              </PostHogProvider>
            </QueryClientProvider>
          </TokenProvider>
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

function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const { session } = useToken();

  const queryClient = useMemo(() => {
    return createQueryClient(session ? sessionStorage : localStorage);
  }, [session]);

  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>;
}
