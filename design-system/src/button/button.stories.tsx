import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Button } from './button';

const meta = {
  title: 'DesignSystem/Button',
  component: Button,
  parameters: {
    controls: controls.exclude(['variant']),
  },
  args: {
    children: 'New button',
    disabled: false,
    loading: false,
  },
  argTypes: {
    color: controls.inlineRadio(['green', 'blue', 'orange', 'red', 'gray']),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};
