import { Meta, StoryObj } from '@storybook/react';

import { controls } from 'src/storybook';

import { Layout } from './layout';

type Args = React.ComponentProps<typeof Layout>;

const viewports = {
  small: {
    name: 'Small',
    styles: { width: '344px', height: '720px' },
  },
  medium: {
    name: 'Medium',
    styles: { width: '1000px', height: '600px' },
  },
  large: {
    name: 'Large',
    styles: { width: '1280px', height: '1080px' },
  },
};

export default {
  title: 'Components/Layout',
  parameters: {
    layout: 'fullscreen',
    viewport: { viewports },
  },
  component: Layout,
  args: {
    header: (
      <div className="w-fit whitespace-nowrap p-2">Header header header header header header header</div>
    ),
    menu: () => <div>menu</div>,
    main: <div>main</div>,
  },
  argTypes: {
    header: controls.hidden(),
    menu: controls.hidden(),
    main: controls.hidden(),
  },
} satisfies Meta<Args>;

export const layout: StoryObj = {};
