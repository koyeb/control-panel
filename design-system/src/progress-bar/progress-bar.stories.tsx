import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { ProgressBar } from './progress-bar';

const meta = {
  title: 'DesignSystem/ProgressBar',
  component: ProgressBar,
  parameters: {
    controls: controls.exclude(['className']),
    className: 'max-w-main',
  },
  argTypes: {
    progress: controls.range({ min: 0, max: 1, step: 0.01 }),
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
