import type { Meta, StoryObj } from '@storybook/react';

import { ComponentPlaceholder, controls } from '../utils/storybook';

import { Collapse } from './collapse';

const meta = {
  title: 'DesignSystem/Collapse',
  component: Collapse,
  parameters: {
    controls: controls.exclude(['children']),
  },
  args: {
    open: true,
    children: <ComponentPlaceholder />,
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
