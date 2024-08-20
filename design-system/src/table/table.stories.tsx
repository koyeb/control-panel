import { Meta, StoryFn } from '@storybook/react';
import EllipsisVertical from 'lucide-static/icons/ellipsis-vertical.svg?react';
import { useState } from 'react';

import { IconButton } from '../button/button';

import { Table } from './table';

export default {
  title: 'DesignSystem/Table',
  component: Table,
} satisfies Meta<typeof Table>;

type Game = {
  id: string;
  name: string;
  released: string;
};

const games: Game[] = [
  { id: '1', name: 'Pac-man', released: '1980-05-22' },
  { id: '2', name: 'Sonic', released: '1991-06-23' },
  { id: '3', name: 'Tetris', released: '1984-06-06' },
  { id: '4', name: 'Street Fighter', released: '1987-08-30' },
  { id: '5', name: 'Zelda', released: '1886-02-21' },
  { id: '6', name: 'Mario Bros', released: '1983-06-14' },
  { id: '7', name: 'Space Invaders', released: '1998-07-01' },
  { id: '8', name: 'Pong', released: '1972-11-29' },
  { id: '9', name: 'Donkey Kong', released: '1981-07-01' },
];

export const Default: StoryFn = () => (
  <Table
    items={games}
    columns={{
      id: {
        header: 'ID',
        render: (item) => item.id,
      },
      name: {
        header: 'Name',
        render: (item) => item.name,
      },
      released: {
        header: 'Released',
        render: (item) => item.released,
      },
      actions: {
        render: () => <IconButton variant="ghost" color="gray" size={1} Icon={EllipsisVertical} />,
      },
    }}
  />
);

export const ExpandableRow: StoryFn = () => {
  const [expanded, setExpanded] = useState<Game[]>([]);

  return (
    <Table
      items={games}
      columns={{
        id: {
          header: 'ID',
          render: (item) => item.id,
        },
        name: {
          header: 'Name',
          render: (item) => item.name,
        },
        released: {
          header: 'Released',
          render: (item) => item.released,
        },
        actions: {
          render: () => <IconButton variant="ghost" color="gray" size={1} Icon={EllipsisVertical} />,
        },
      }}
      isExpanded={(item) => expanded.includes(item)}
      onRowClick={(item) => setExpanded(arrayToggle(item))}
      renderExpanded={(item) => <>{item.name}</>}
    />
  );
};

function arrayToggle<T>(item: T) {
  return (array: T[]) => {
    const index = array.indexOf(item);

    if (index < 0) {
      return [...array, item];
    } else {
      return [...array.slice(0, index), ...array.slice(index + 1)];
    }
  };
}
