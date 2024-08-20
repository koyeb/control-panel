import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Checkbox } from './checkbox';

const meta = {
  title: 'DesignSystem/Checkbox',
  component: Checkbox,
  args: {
    label: 'Label',
    helpTooltip: 'Help tooltip',
  },
  argTypes: {
    checked: controls.boolean(),
    disabled: controls.hidden(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
