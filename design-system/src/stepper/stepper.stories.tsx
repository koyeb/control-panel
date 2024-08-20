import type { Meta, StoryFn } from '@storybook/react';

import { Step, Stepper } from './stepper';

export default {
  title: 'DesignSystem/Stepper',
  component: Stepper,
} satisfies Meta<typeof Stepper>;

export const Default: StoryFn = () => (
  <Stepper>
    <Step>Step 1</Step>
    <Step active>Step 2</Step>
    <Step>Step 3</Step>
    <Step>Step 4</Step>
  </Stepper>
);
