import type { Meta, StoryObj } from '@storybook/react';

import { controls } from '../utils/storybook';

import { Select } from './select';

type Game = {
  name: string;
  released: string;
};

const games: Game[] = [
  { name: 'Pac-man', released: '1980-05-22' },
  { name: 'Sonic', released: '1991-06-23' },
  { name: 'Tetris', released: '1984-06-06' },
  { name: 'Street Fighter', released: '1987-08-30' },
  { name: 'Zelda', released: '1886-02-21' },
  { name: 'Mario Bros', released: '1983-06-14' },
  { name: 'Space Invaders', released: '1998-07-01' },
  { name: 'Pong', released: '1972-11-29' },
  { name: 'Donkey Kong', released: '1981-07-01' },
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
        {game.name} <span className="text-dim">{game.released}</span>
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
