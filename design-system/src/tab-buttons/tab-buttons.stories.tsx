import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { controls } from '../utils/storybook';

import { TabButton, TabButtons } from './tab-buttons';

const meta = {
  title: 'DesignSystem/TabButtons',
  component: TabButtons,
  parameters: {
    controls: controls.exclude(['className', 'children']),
  },
} satisfies Meta<typeof TabButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    const [selected, setSelected] = useState(2);

    return (
      <TabButtons className="max-w-sm">
        <TabButton selected={selected === 1} onClick={() => setSelected(1)}>
          Tab 1
        </TabButton>

        <TabButton selected={selected === 2} onClick={() => setSelected(2)}>
          Tab 2
        </TabButton>

        <TabButton selected={selected === 3} onClick={() => setSelected(3)}>
          Tab 3
        </TabButton>
      </TabButtons>
    );
  },
};
