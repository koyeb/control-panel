import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Spinner } from './spinner';

const meta = {
  title: 'DesignSystem/Spinner',
  component: Spinner,
  parameters: {
    controls: controls.exclude(['className']),
  },
  args: {
    className: 'size-24',
  },
  argTypes: {
    progress: controls.number({ min: 0, max: 1, step: 0.01 }),
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
