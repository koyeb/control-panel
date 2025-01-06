import { Elements as StripeElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Component, Suspense, useMemo } from 'react';

import { useMount } from 'src/hooks/lifecycle';
import { useSearchParam } from 'src/hooks/router';

import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { NotificationContainer } from '../components/notification';
import { IntlProvider } from '../intl/translation-provider';

import { getConfig } from './config';
import { DialogProvider } from './dialog-context';
import { PostHogProvider } from './posthog';
import { createQueryClient } from './query-client';
import { reportError } from './report-error';
import { TokenProvider, useToken } from './token';

const { stripePublicKey } = getConfig();

export type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const stripePromise = useMemo(() => {
    if (stripePublicKey !== undefined) {
      return loadStripe(stripePublicKey);
    }

    return new Promise<never>(() => {});
  }, []);

  if (useStoreSessionToken()) {
    return null;
  }

  return (
    <RootErrorBoundary>
      <IntlProvider>
        <Suspense>
          <TokenProvider>
            <QueryClientProvider>
              <PostHogProvider>
                <StripeElements stripe={stripePromise}>
                  <DialogProvider>
                    <ReactQueryDevtools />
                    <NotificationContainer />
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </DialogProvider>
                </StripeElements>
              </PostHogProvider>
            </QueryClientProvider>
          </TokenProvider>
        </Suspense>
      </IntlProvider>
    </RootErrorBoundary>
  );
}

export class RootErrorBoundary extends Component<{ children: React.ReactNode }> {
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

function useStoreSessionToken() {
  const [token, setToken] = useSearchParam('session-token');

  useMount(() => {
    if (token !== null) {
      sessionStorage.setItem('session-token', token);
      setToken(null);
    }
  });

  return token !== null;
}
