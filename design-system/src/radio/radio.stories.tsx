import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Radio } from './radio';

const meta = {
  title: 'DesignSystem/Radio',
  component: Radio,
  args: {
    label: 'Label',
  },
  argTypes: {
    checked: controls.boolean(),
    disabled: controls.hidden(),
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
