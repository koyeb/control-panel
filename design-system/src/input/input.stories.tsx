import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Input, InputEnd, InputStart } from './input';

const meta = {
  title: 'DesignSystem/Input',
  component: Input,
  parameters: {
    controls: controls.exclude(['className', 'disabled']),
  },
  args: {
    className: 'max-w-sm',
    label: 'Label',
    helpTooltip: 'Help tooltip',
    placeholder: 'Placeholder',
    helperText: 'Helper text',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    error: 'Error message',
  },
  argTypes: {
    helperText: controls.hidden(),
  },
};

export const Adornments: Story = {
  args: {
    start: <InputStart>Start</InputStart>,
    end: <InputEnd>End</InputEnd>,
  },
  argTypes: {
    start: controls.hidden(),
    end: controls.hidden(),
  },
};
