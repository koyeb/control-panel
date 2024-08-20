import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Switch } from './switch';

const meta = {
  title: 'DesignSystem/Switch',
  component: Switch,
  parameters: {
    controls: controls.exclude(['onChange']),
  },
  args: {
    label: 'Label',
    helpTooltip: 'Help tooltip',
  },
  argTypes: {
    checked: controls.boolean(),
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
