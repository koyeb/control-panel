import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Checkbox } from '../checkbox/checkbox';
import { controls } from '../utils/storybook';

import { MultiSelect, Select } from './select';

type Game = {
  name: string;
  released: string;
};

const games: Game[] = [
  { name: 'Pac-man', released: 'May 1980' },
  { name: 'Sonic', released: 'June 1991' },
  { name: 'Tetris', released: 'June 1984' },
  { name: 'Street Fighter', released: 'August 1987' },
  { name: 'Zelda', released: 'February 1886' },
  { name: 'Mario Bros', released: 'June 1983' },
  { name: 'Space Invaders', released: 'July 1998' },
  { name: 'Pong', released: 'November 1972' },
  { name: 'Donkey Kong', released: 'July 1981' },
];

const meta = {
  title: 'DesignSystem/Select',
  component: Select,
  parameters: {
    controls: controls.exclude(['className', 'disabled', 'items', 'getKey', 'itemToString', 'renderItem']),
  },
  args: {
    className: 'max-w-sm',
    label: 'Label',
    helpTooltip: 'Help tooltip',
    placeholder: 'Placeholder',
    helperText: 'Helper text',
    items: games,
    getKey: (game) => game.name,
    itemToString: (game) => game.name,
    renderItem: (game: Game) => (
      <>
        {game.name} <span className="text-dim">- {game.released}</span>
      </>
    ),
  },
  argTypes: {
    open: controls.boolean(),
  },
} satisfies Meta<typeof Select<Game>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    error: 'Error message',
  },
  argTypes: {
    helperText: controls.hidden(),
  },
};

const groups = [
  { key: '7', label: '1970s', items: games.filter((game) => game.released.startsWith('197')) },
  { key: '8', label: '1980s', items: games.filter((game) => game.released.startsWith('198')) },
  { key: '9', label: '1990s', items: games.filter((game) => game.released.startsWith('199')) },
];

export const Groups: Story = {
  args: {
    items: groups.flatMap((group) => group.items),
    groups,
  },
};

export const multiSelect: StoryFn<typeof MultiSelect<Game>> = (args) => {
  const [selected, setSelected] = useState<Game[]>([]);

  return (
    <MultiSelect
      {...args}
      selectedItems={selected}
      onItemsSelected={(game) => setSelected([...selected, game])}
      onItemsUnselected={(game) => setSelected(selected.filter((selected) => selected !== game))}
      renderItem={(game, selected) => (
        <div className="row items-center gap-2">
          <Checkbox checked={selected} onChange={() => {}} />
          {game.name} <span className="text-dim">- {game.released}</span>
        </div>
      )}
      renderSelectedItems={(games) => <>{games.map((game) => game.name).join(', ')}</>}
    />
  );
};
