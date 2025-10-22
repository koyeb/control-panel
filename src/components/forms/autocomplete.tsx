import { Autocomplete } from '@koyeb/design-system';
import { useMemo } from 'react';
import { FieldPath, FieldValues, PathValue, useController } from 'react-hook-form';

import { usePureFunction } from 'src/hooks/lifecycle';

import { ControlledProps } from './controlled-props';
import { LabelTooltip } from './label-tooltip';

type ControlledAutocompleteProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
> = Omit<ControlledProps<typeof Autocomplete<Item>, Form, Name>, 'onChangeEffect'> & {
  allItems: Item[];
  itemToValue: (item: Item) => PathValue<Form, Name>;
  onChangeEffect?: (value: Item) => void;
};

export function ControlledAutocomplete<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
>(props: ControlledAutocompleteProps<Form, Name, Item> & { tooltip?: React.ReactNode }) {
  const { control, name, label, tooltip, allItems, itemToValue, onChangeEffect, ...rest } = props;

  const {
    field: { value, onChange, ...field },
    fieldState: { invalid, error },
  } = useController({ control, name });

  const itemToValuePure = usePureFunction(itemToValue);

  const valueToItemMap = useMemo(
    () => new Map(allItems.map((item) => [itemToValuePure(item), item])),
    [allItems, itemToValuePure],
  );

  return (
    <Autocomplete
      {...field}
      label={label ? <LabelTooltip label={label} tooltip={tooltip} /> : null}
      helperText={error?.message}
      invalid={invalid}
      selectedItem={valueToItemMap.get(value) ?? null}
      onSelectedItemChange={(item) => {
        onChange(itemToValue(item));
        onChangeEffect?.(item);
      }}
      {...rest}
    />
  );
}
