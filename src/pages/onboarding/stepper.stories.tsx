import { Meta, StoryFn } from '@storybook/react';

import { controls } from 'src/storybook';

import { OnboardingStepper } from './stepper';

type Args = React.ComponentProps<typeof OnboardingStepper>;

export default {
  title: 'Components/OnboardingStepper',
  args: {
    step: 1 as const,
  },
  argTypes: {
    step: controls.inlineRadio([1, 2, 3]),
  },
} satisfies Meta<Args>;

export const onboardingStepper: StoryFn<Args> = ({ step }) => <OnboardingStepper step={step} />;
