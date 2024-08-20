import type { Meta, StoryObj } from '@storybook/react';

import { ComponentPlaceholder, controls } from '../utils/storybook';

import { SelectBox } from './select-box';

const meta = {
  title: 'DesignSystem/SelectBox',
  component: SelectBox,
  parameters: {
    controls: controls.exclude(['className', 'type', 'footer', 'disabled']),
  },
  args: {
    className: 'w-64',
    title: 'Title',
    description: 'Description',
  },
  argTypes: {
    checked: controls.boolean(),
  },
} satisfies Meta<typeof SelectBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checkbox: Story = {
  args: {
    type: 'checkbox',
  },
};

export const Radio: Story = {
  args: {
    type: 'radio',
  },
};

export const WithFooter: Story = {
  args: {
    ...Checkbox.args,
    footer: <ComponentPlaceholder />,
  },
};

export const Disabled: Story = {
  args: {
    ...Checkbox.args,
    disabled: true,
  },
};
