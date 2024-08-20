import type { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import { controls } from '../utils/storybook';

import { Tab, Tabs, VerticalTab, VerticalTabs } from './tabs';

const meta = {
  title: 'DesignSystem/Tabs',
  parameters: {
    controls: controls.exclude(['className', 'children']),
  },
} satisfies Meta;

export default meta;
type Story = StoryFn;

export const Default: Story = () => {
  const [selected, setSelected] = useState(1);

  return (
    <Tabs>
      <Tab component="button" selected={selected === 1} onClick={() => setSelected(1)}>
        Tab 1
      </Tab>
      <Tab component="button" selected={selected === 2} onClick={() => setSelected(2)}>
        Tab 2
      </Tab>
      <Tab component="button" selected={selected === 3} onClick={() => setSelected(3)}>
        Tab 3
      </Tab>
    </Tabs>
  );
};

export const Vertical: Story = () => {
  const [selected, setSelected] = useState(1);

  return (
    <VerticalTabs className="max-w-48">
      <VerticalTab component="button" selected={selected === 1} onClick={() => setSelected(1)}>
        Tab 1
      </VerticalTab>
      <VerticalTab component="button" selected={selected === 2} onClick={() => setSelected(2)}>
        Tab 2
      </VerticalTab>
      <VerticalTab component="button" selected={selected === 3} onClick={() => setSelected(3)}>
        Tab 3
      </VerticalTab>
    </VerticalTabs>
  );
};
