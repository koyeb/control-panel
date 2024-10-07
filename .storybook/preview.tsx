import { addons } from '@storybook/preview-api';
import type { Preview } from '@storybook/react';
import { Elements as StripeElements } from '@stripe/react-stripe-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';

import { AnalyticsProvider, NoopAnalytics } from '../src/application/analytics';
import { ApiMock } from '../src/api/mock/mock-api';
import { IntlProvider } from '../src/intl/translation-provider';
import { ThemeMode, useThemeMode } from '../src/hooks/theme';
import { TokenProvider } from '../src/application/token';

import '@fontsource-variable/inter';

import '../src/styles.css';

export default {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /color$/i,
      },
    },
    options: {
      storySort: {
        order: ['DesignSystem', ['Theme'], 'Components', 'Modules'],
      },
    },
    darkMode: {
      stylePreview: true,
      classTarget: 'html',
    },
  },
  decorators: [
    (Story, { parameters: { className } }) => {
      return typeof className === 'string' ? (
        <div className={className}>
          <Story />
        </div>
      ) : (
        <Story />
      );
    },
    (Story) => (
      <StripeElements stripe={new Promise<never>(() => {})}>
        <Story />
      </StripeElements>
    ),
    (Story) => (
      <AnalyticsProvider analytics={new NoopAnalytics()}>
        <Story />
      </AnalyticsProvider>
    ),
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
    (Story) => (
      <TokenProvider>
        <Story />
      </TokenProvider>
    ),
    (Story) => (
      <IntlProvider>
        <Story />
      </IntlProvider>
    ),
    (Story) => (
      <SetThemeMode>
        <Story />
      </SetThemeMode>
    ),
    (Story, { args, parameters }) => {
      new ApiMock();
      parameters.mockApi?.(args);
      return <Story />;
    },
  ],
} satisfies Preview;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 1000,
      retry: false,
      throwOnError: true,
    },
    mutations: {
      throwOnError: true,
    },
  },
});

const channel = addons.getChannel();

function SetThemeMode({ children }: { children: React.ReactNode }) {
  const [, setTheme] = useThemeMode();

  useEffect(() => {
    function handler(dark: boolean) {
      setTheme(dark ? ThemeMode.dark : ThemeMode.light);
    }

    channel.on(DARK_MODE_EVENT_NAME, handler);

    return () => {
      channel.off(DARK_MODE_EVENT_NAME, handler);
    };
  }, []);

  return children;
}
