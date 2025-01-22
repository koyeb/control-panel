import { Placement } from '@floating-ui/react';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Floating } from './floating';

const meta = {
  title: 'DesignSystem/Floating',
  component: Floating,
  parameters: {
    controls: controls.exclude(['className', 'disabled']),
    layout: 'centered',
  },
  args: {
    open: true,
    setOpen: action('setOpen'),
    offset: 8,
    placement: 'bottom',
    renderReference: (props) => <div {...props} className="size-8 bg-muted/20" />,
    renderFloating: (props) => (
      <div {...props} className="w-fit rounded border bg-neutral p-2 shadow">
        Floating
      </div>
    ),
  },
  argTypes: {
    placement: controls.inlineRadio<Placement>(['top', 'left', 'right', 'bottom']),
    setOpen: controls.hidden(),
    renderReference: controls.hidden(),
    renderFloating: controls.hidden(),
  },
} satisfies Meta<typeof Floating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
