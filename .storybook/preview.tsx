import '@fontsource-variable/inter';

import type { Preview } from '@storybook/react-vite';

import { IntlProvider } from '../src/intl/translation-provider';

import '../src/styles.css';

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
    (Story) => (
      <IntlProvider>
        <Story />
      </IntlProvider>
    ),
  ],
} satisfies Preview;
