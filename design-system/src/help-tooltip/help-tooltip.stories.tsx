import type { Meta, StoryObj } from '@storybook/react';

import { HelpTooltip } from './help-tooltip';

const meta = {
  title: 'DesignSystem/HelpTooltip',
  component: HelpTooltip,
  args: {
    children: 'This information is helpful.',
  },
} satisfies Meta<typeof HelpTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
