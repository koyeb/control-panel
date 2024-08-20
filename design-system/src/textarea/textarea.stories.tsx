import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { TextArea } from './textarea';

const meta = {
  title: 'DesignSystem/TextArea',
  component: TextArea,
  parameters: {
    controls: controls.exclude(['className', 'disabled']),
  },
  args: {
    className: 'max-w-sm',
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Helper text',
  },
} satisfies Meta<typeof TextArea>;

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
