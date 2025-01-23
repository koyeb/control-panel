import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/inter';

import { api } from '../src/api/api';
import { catalogInstanceFixtures, catalogRegionFixtures } from '../src/api/mock/fixtures';
import { DialogProvider } from '../src/application/dialog-context';
import { TokenProvider } from '../src/application/token';
import { IntlProvider } from '../src/intl/translation-provider';
import '../src/styles.css';

api.listCatalogInstances = async () => ({ instances: catalogInstanceFixtures });
api.listCatalogRegions = async () => ({ regions: catalogRegionFixtures });

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
      <TokenProvider>
        <Story />
      </TokenProvider>
    ),
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
    (Story) => (
      <IntlProvider>
        <Story />
      </IntlProvider>
    ),
    (Story) => (
      <DialogProvider>
        <Story />
      </DialogProvider>
    ),
  ],
} satisfies Preview;
