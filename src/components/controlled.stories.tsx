import type { Decorator, Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { useFormValues } from 'src/hooks/form';
import { getId, getName, hasProperty } from 'src/utils/object';

import {
  ControlledAutocomplete,
  ControlledCheckbox,
  ControlledInput,
  ControlledRadio,
  ControlledSelect,
  ControlledSelectBox,
  ControlledSlider,
  ControlledStringArrayInput,
  ControlledSwitch,
} from './controlled';

const meta = {
  title: 'Components/Controlled',
} satisfies Meta;

export default meta;
type Story = StoryFn<typeof meta>;

function form(defaultValues: object): Decorator {
  // eslint-disable-next-line react/display-name
  return (Story) => {
    const form = useForm({ defaultValues });

    return (
      <FormProvider {...form}>
        <form className="col items-start gap-4">
          <Story />

          <button type="button" onClick={() => form.reset()}>
            Reset
          </button>

          <pre>{JSON.stringify(form.watch(), null, 2)}</pre>
        </form>
      </FormProvider>
    );
  };
}

type Game = {
  id: number;
  name: string;
  released: string;
};

const games: Game[] = [
  { id: 1, name: 'Pac-man', released: '1980-05-22' },
  { id: 2, name: 'Sonic', released: '1991-06-23' },
  { id: 3, name: 'Tetris', released: '1984-06-06' },
  { id: 4, name: 'Street Fighter', released: '1987-08-30' },
  { id: 5, name: 'Zelda', released: '1886-02-21' },
  { id: 6, name: 'Mario Bros', released: '1983-06-14' },
  { id: 7, name: 'Space Invaders', released: '1998-07-01' },
  { id: 8, name: 'Pong', released: '1972-11-29' },
  { id: 9, name: 'Donkey Kong', released: '1981-07-01' },
];

export const autocomplete: Story = () => {
  const [search, setSearch] = useState('');
  const { field } = useFormValues<{ field: number }>();
  const selected = games.find(hasProperty('id', field));

  return (
    <ControlledAutocomplete
      name="field"
      items={games.filter((game) => (search === selected?.name ? true : game.name.includes(search)))}
      allItems={games}
      getKey={getId}
      itemToValue={getId}
      itemToString={getName}
      onInputValueChange={setSearch}
      renderItem={getName}
      className="max-w-sm"
    />
  );
};

autocomplete.decorators = [form({ field: games[4]?.id })];

export const checkbox: Story = () => {
  return <ControlledCheckbox name="field" />;
};

checkbox.decorators = [form({ field: true })];

export const input: Story = () => {
  return <ControlledInput name="field" className="max-w-sm" />;
};

input.decorators = [form({ field: 'value' })];

export const stringArrayInput: Story = () => {
  return <ControlledStringArrayInput name="field" className="max-w-sm" />;
};

stringArrayInput.decorators = [form({ field: ['foo', 'bar'] })];

export const radio: Story = () => {
  return (
    <div className="row gap-4">
      <ControlledRadio name="field" value="one" label="One" />
      <ControlledRadio name="field" value="two" label="Two" />
    </div>
  );
};

radio.decorators = [form({ field: 'one' })];

export const select: Story = () => {
  return (
    <ControlledSelect
      name="field"
      items={games}
      getKey={getId}
      itemToValue={getId}
      itemToString={getName}
      renderItem={getName}
      className="max-w-sm"
    />
  );
};

select.decorators = [form({ field: games[4]?.id })];

export const selectBox: Story = () => {
  return (
    <ControlledSelectBox
      name="field"
      type="checkbox"
      title="Title"
      description="Description"
      className="max-w-sm"
    />
  );
};

selectBox.decorators = [form({ field: true })];

export const slider: Story = () => {
  return <ControlledSlider name="field" min={1} max={10} step={1} marks className="max-w-sm" />;
};

slider.decorators = [form({ field: 4 })];

export const switch_: Story = () => {
  return <ControlledSwitch name="field" label="Label" />;
};

switch_.storyName = 'Switch';
switch_.decorators = [form({ field: true })];
