import { Autocomplete, Checkbox, Radio, SelectBox, Slider, Switch, TextArea } from '@koyeb/design-system';
import { FieldLabel } from '@koyeb/design-system/next';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import { Control, FieldPath, FieldValues, PathValue, useController } from 'react-hook-form';

import { usePureFunction } from 'src/hooks/lifecycle';
import { Extend } from 'src/utils/types';

import { InfoTooltip } from './tooltip';

export { ControlledInput } from './forms/input';
export { ControlledSelect } from './forms/select';

export type ControlledProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component extends React.JSXElementConstructor<any>,
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
> = Extend<
  React.ComponentProps<Component>,
  {
    control?: Control<Form>;
    name: Name;
    onChangeEffect?: (event: React.ChangeEvent<React.ComponentRef<Component>>) => void;
  }
>;

export function ControlledCheckbox<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>(props: ControlledProps<typeof Checkbox, Form, Name> & { tooltip?: React.ReactNode }) {
  const { control, label, tooltip: tooltip, name, onChangeEffect, ...rest } = props;
  const { field } = useController({ control, name });

  return (
    <Checkbox
      {...field}
      label={label ? <LabelTooltip label={label} tooltip={tooltip} /> : null}
      checked={field.value}
      onChange={(event) => {
        field.onChange(event);
        onChangeEffect?.(event);
      }}
      {...rest}
    />
  );
}

export function ControlledRadio<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>(props: ControlledProps<typeof Radio, Form, Name> & { tooltip?: React.ReactNode }) {
  const { control, name, label, tooltip, value, ...rest } = props;
  const { field } = useController({ control, name });

  return (
    <Radio
      {...field}
      label={label ? <LabelTooltip label={label} tooltip={tooltip} /> : null}
      checked={field.value === value}
      onChange={() => field.onChange(value)}
      {...rest}
    />
  );
}

export function ControlledSwitch<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, onChangeEffect, ...props }: ControlledProps<typeof Switch, Form, Name>) {
  const { field } = useController({ control, name });

  return (
    <Switch
      {...field}
      checked={field.value}
      onChange={(event) => {
        field.onChange(event);
        onChangeEffect?.(event);
      }}
      {...props}
    />
  );
}

export function ControlledSlider<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, value, ...props }: ControlledProps<typeof Slider, Form, Name>) {
  const { field } = useController({ control, name });

  return <Slider {...field} {...props} />;
}

export function ControlledSelectBox<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, onChangeEffect, ...props }: ControlledProps<typeof SelectBox, Form, Name>) {
  const {
    field: { value, onChange, ...field },
  } = useController({ control, name });

  const controlProps: Partial<React.ComponentProps<typeof SelectBox>> = {};

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: unknown) => {
    onChange(value);
    onChangeEffect?.(event);
  };

  if (props.value !== undefined) {
    controlProps.checked = value === props.value;
    controlProps.onChange = (event) => handleChange(event, props.value);
  } else {
    controlProps.checked = value;
    controlProps.onChange = (event) => handleChange(event, event);
  }

  return <SelectBox {...field} {...controlProps} {...props} />;
}

export function ControlledTextArea<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, onChangeEffect, ...props }: ControlledProps<typeof TextArea, Form, Name>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <TextArea
      {...field}
      invalid={fieldState.invalid}
      helperText={fieldState.error?.message}
      value={field.value}
      onChange={(event) => {
        field.onChange(event.target.value);
        onChangeEffect?.(event);
      }}
      {...props}
    />
  );
}

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

type LabelTooltipProps = Extend<
  React.ComponentProps<typeof FieldLabel>,
  {
    label: React.ReactNode;
    tooltip?: React.ReactNode;
  }
>;

export function LabelTooltip({ label, tooltip, className, ...props }: LabelTooltipProps) {
  if (!label) {
    return null;
  }

  return (
    <FieldLabel className={clsx(tooltip && 'inline-flex flex-row items-center gap-2', className)} {...props}>
      {label}
      {tooltip && <InfoTooltip content={tooltip} />}
    </FieldLabel>
  );
}
