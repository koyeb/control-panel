import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Alert } from './alert';

const meta = {
  title: 'DesignSystem/Alert',
  component: Alert,
  parameters: {
    controls: controls.exclude(['style', 'className']),
  },
  args: {
    title: 'Title',
    description: 'Description',
    className: 'max-w-sm',
  },
  argTypes: {
    variant: controls.inlineRadio(['info', 'warning', 'error']),
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const solid: Story = {
  args: { style: 'solid' },
};

export const outline: Story = {
  args: { style: 'outline' },
};
