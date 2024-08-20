import { Placement } from '@floating-ui/react';
import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Tooltip } from './tooltip';

const meta = {
  title: 'DesignSystem/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    controls: controls.exclude(['className', 'open', 'children']),
  },
  args: {
    content: 'This is a tooltip',
    children: (props) => <div className="size-24 rounded bg-inverted/25 font-semibold" {...props} />,
  },
  argTypes: {
    color: controls.inlineRadio(['inverted', 'neutral']),
    arrow: controls.boolean(),
    allowHover: controls.boolean(),
    placement: controls.inlineRadio<Placement>(['top', 'left', 'right', 'bottom']),
    title: controls.hidden(),
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: {
    open: true,
  },
};

export const WithDescription: Story = {
  args: {
    title: 'This is a tooltip',
    content: 'Longer tooltip description to explain more complicated topics',
  },
};
