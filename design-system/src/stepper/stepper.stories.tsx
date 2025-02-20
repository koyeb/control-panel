import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { Stepper } from './stepper';

const meta = {
  title: 'DesignSystem/Stepper',
  component: Stepper,
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    activeStep: 2,
    totalSteps: 5,
    onClick: action('onClick'),
  },
};
