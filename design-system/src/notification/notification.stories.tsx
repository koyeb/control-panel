import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Notification } from './notification';

const meta = {
  title: 'DesignSystem/Notification',
  component: Notification,
  parameters: {
    controls: controls.exclude(['className', 'variant']),
  },
  args: {
    className: 'max-w-sm',
    title: 'Notification title',
    children: 'Description, lorem ipsum dolor sit amet...',
  },
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Error: Story = {
  args: {
    variant: 'error',
  },
};
