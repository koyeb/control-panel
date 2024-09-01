import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { ButtonMenuItem, Menu } from './menu';

const meta = {
  title: 'DesignSystem/Menu',
  parameters: {
    controls: controls.exclude(['className', 'variant']),
  },
  args: {
    className: 'max-w-fit',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render(args) {
    return (
      <Menu {...args}>
        <ButtonMenuItem>Menu item 1</ButtonMenuItem>
        <ButtonMenuItem>Menu item 2</ButtonMenuItem>
        <ButtonMenuItem>Menu item 3</ButtonMenuItem>
        <ButtonMenuItem disabled>Disabled item</ButtonMenuItem>
      </Menu>
    );
  },
};
