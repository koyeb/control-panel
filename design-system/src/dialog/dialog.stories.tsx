import type { Meta, StoryObj } from '@storybook/react';

import { ComponentPlaceholder, controls } from '../utils/storybook';

import { Dialog } from './dialog';

const meta = {
  title: 'DesignSystem/Dialog',
  component: Dialog,
  parameters: {
    controls: controls.exclude(['width', 'children']),
  },
  args: {
    isOpen: true,
    title: 'Title',
    description: 'Description',
    width: 'md',
    children: <ComponentPlaceholder />,
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
