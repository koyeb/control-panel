import type { Meta, StoryObj } from '@storybook/react';
import IconBox from 'lucide-static/icons/box.svg?react';

import { controls } from '../utils/storybook';

import { StatusIcon } from './status-icon';

const meta = {
  title: 'DesignSystem/StatusIcon',
  component: StatusIcon,
  parameters: {
    controls: controls.exclude(['Icon', 'color']),
  },
  args: {
    Icon: IconBox,
  },
  argTypes: {},
} satisfies Meta<typeof StatusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const red: Story = {
  args: { color: 'red' },
};

export const green: Story = {
  args: { color: 'green' },
};

export const blue: Story = {
  args: { color: 'blue' },
};

export const orange: Story = {
  args: { color: 'orange' },
};

export const gray: Story = {
  args: { color: 'gray' },
};
