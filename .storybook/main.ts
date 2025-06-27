import type { StorybookConfig } from '@storybook/react-vite';

export default {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@vueless/storybook-dark-mode'],
  framework: '@storybook/react-vite',
} satisfies StorybookConfig;
