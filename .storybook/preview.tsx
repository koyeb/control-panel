import '@fontsource-variable/inter';

import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiPort } from '../src/api/api';
import {
  catalogDatacenterFixtures,
  catalogInstanceFixtures,
  catalogRegionFixtures,
} from '../src/api/mock/fixtures';
import { container } from '../src/application/container';
import { DialogProvider } from '../src/application/dialog-context';
import { IntlProvider } from '../src/intl/translation-provider';
import { TOKENS } from '../src/tokens';

import '../src/styles.css';

const api: Partial<ApiPort> = {};

api.listCatalogInstances = async () => ({ instances: catalogInstanceFixtures });
api.listCatalogRegions = async () => ({ regions: catalogRegionFixtures });
api.listCatalogDatacenters = async () => ({ datacenters: catalogDatacenterFixtures });
api.getCurrentOrganization = async () => ({ organization: {} });

export default {
  parameters: {
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
    (Story) => {
      container.bindValue(TOKENS.api, api);
      return <Story />;
    },
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
