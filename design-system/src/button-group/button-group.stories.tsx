import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button/button';
import { controls } from '../utils/storybook';

import { ButtonGroup } from './button-group';

const meta = {
  title: 'DesignSystem/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    controls: controls.exclude(['children']),
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Button>Left</Button>
        <Button>Middle</Button>
        <Button>Right</Button>
      </>
    ),
  },
};
