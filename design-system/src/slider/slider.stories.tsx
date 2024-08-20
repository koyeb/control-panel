import type { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import { controls } from '../utils/storybook';

import { Slider } from './slider';

const meta = {
  title: 'DesignSystem/Slider',
  component: Slider,
  parameters: {
    controls: controls.exclude(['className', 'value']),
  },
  args: {
    className: 'max-w-sm',
    disabled: false,
    marks: true,
    min: 0,
    max: 8,
    step: 1,
  },
  argTypes: {
    value: controls.number(),
  },
} satisfies Meta<typeof Slider<number>>;

export default meta;

export const Default: StoryFn = (args) => {
  const [value, setValue] = useState(2);

  return <Slider {...args} value={value} onChange={setValue} />;
};

export const Range: StoryFn = (args) => {
  const [value, setValue] = useState<[number, number]>([2, 5]);

  return <Slider {...args} value={value} onChange={setValue} />;
};
