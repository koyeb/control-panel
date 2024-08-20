import { AnalyticsBrowser } from '@segment/analytics-next';
import { Elements as StripeElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Component, Suspense, useMemo } from 'react';

import { useMount } from 'src/hooks/lifecycle';
import { useSearchParam } from 'src/hooks/router';
import { useSessionStorage } from 'src/hooks/storage';

import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { NotificationContainer } from '../components/notification';
import { IntlProvider } from '../intl/translation-provider';

import { AnalyticsProvider, LogAnalytics, NoopAnalytics } from './analytics';
import { getConfig } from './config';
import { createQueryClient } from './query-client';
import { reportError } from './report-error';
import { AccessTokenProvider } from './token';

const { segmentWriteKey, stripePublicKey } = getConfig();

export type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const analytics = useMemo(() => {
    if (segmentWriteKey === '') {
      return new NoopAnalytics();
    }

    if (segmentWriteKey === 'log') {
      return new LogAnalytics();
    }

    return new AnalyticsBrowser();
  }, []);

  const queryClient = useMemo(() => {
    return createQueryClient(analytics);
  }, [analytics]);

  const stripePromise = useMemo(() => {
    if (stripePublicKey !== undefined) {
      return loadStripe(stripePublicKey);
    }

    return new Promise<never>(() => {});
  }, []);

  const hasSessionToken = useSessionToken();

  if (hasSessionToken) {
    return null;
  }

  return (
    <RootErrorBoundary>
      <IntlProvider>
        <Suspense>
          <AccessTokenProvider>
            <QueryClientProvider client={queryClient}>
              <AnalyticsProvider analytics={analytics}>
                <StripeElements stripe={stripePromise}>
                  <ReactQueryDevtools />
                  <NotificationContainer />
                  <ErrorBoundary>{children}</ErrorBoundary>
                </StripeElements>
              </AnalyticsProvider>
            </QueryClientProvider>
          </AccessTokenProvider>
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

function useSessionToken() {
  const [token, setToken] = useSearchParam('session-token');
  const [, storeToken] = useSessionStorage('session-token', { parse: String, stringify: String });

  useMount(() => {
    if (token !== null) {
      storeToken(token);
      setToken(null);
    }
  });

  return token !== null;
}
