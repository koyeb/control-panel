import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { controls } from '../utils/storybook';

import { Autocomplete } from './autocomplete';

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
  title: 'DesignSystem/Autocomplete',
  component: Autocomplete,
  parameters: {
    controls: controls.exclude([
      'disabled',
      'className',
      'items',
      'getKey',
      'itemToString',
      'renderItem',
      'renderNoItems',
    ]),
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
    renderItem: (game) => (
      <>
        {game.name} <span className="text-dim">{game.released}</span>
      </>
    ),
    renderNoItems: () => 'No items',
  },
  argTypes: {
    open: controls.boolean(),
  },
  render(props) {
    const [selected, setSelected] = useState<Game | null>(null);
    const [items, setItems] = useState(props.items);

    return (
      <Autocomplete
        {...props}
        items={items}
        selectedItem={selected}
        onSelectedItemChange={(item) => {
          setSelected(item);
          setItems(props.items);
        }}
        onInputValueChange={(value) => {
          if (value === '') {
            setItems(props.items);
          } else {
            setItems(props.items.filter((item) => item.name.toLowerCase().includes(value.toLowerCase())));
          }
        }}
      />
    );
  },
} satisfies Meta<typeof Autocomplete<Game>>;

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
};
