import React, { forwardRef, useMemo } from 'react';
import { Control, FieldPath, FieldValues, PathValue, useController } from 'react-hook-form';

import {
  Autocomplete,
  Checkbox,
  Input,
  Radio,
  Select,
  SelectBox,
  Slider,
  Switch,
  TextArea,
  mergeRefs,
} from '@koyeb/design-system';
import { usePureFunction } from 'src/hooks/lifecycle';

import { StringArrayInput } from './string-array-input';

type ControlledProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component extends React.JSXElementConstructor<any>,
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
> = React.ComponentProps<Component> & {
  control?: Control<Form>;
  name: Name;
  onChangeEffect?: (event: React.ChangeEvent<React.ComponentRef<Component>>) => void;
};

export function ControlledCheckbox<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, onChangeEffect, ...props }: ControlledProps<typeof Checkbox, Form, Name>) {
  const { field } = useController({ control, name });

  return (
    <Checkbox
      {...field}
      checked={field.value}
      onChange={(event) => {
        field.onChange?.(event);
        onChangeEffect?.(event);
      }}
      {...props}
    />
  );
}

export function ControlledRadio<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, value, ...props }: ControlledProps<typeof Radio, Form, Name>) {
  const { field } = useController({ control, name });

  return (
    <Radio {...field} checked={field.value === value} onChange={() => field.onChange(value)} {...props} />
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

function ControlledInput_<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>(
  { control, name, onChangeEffect, ...props }: ControlledProps<typeof Input, Form, Name>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const { field, fieldState } = useController({ control, name });

  return (
    <Input
      {...field}
      ref={mergeRefs(ref, field.ref)}
      invalid={fieldState.invalid}
      helperText={fieldState.error?.message}
      value={Number.isNaN(field.value) ? '' : field.value}
      onChange={(event) => {
        field.onChange(props.type === 'number' ? event.target.valueAsNumber : event.target.value);
        onChangeEffect?.(event);
      }}
      {...props}
    />
  );
}

export const ControlledInput = forwardRef(ControlledInput_);

export function ControlledStringArrayInput<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, ...props }: ControlledProps<typeof StringArrayInput, Form, Name>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <StringArrayInput
      {...field}
      invalid={fieldState.invalid}
      helperText={fieldState.error?.message}
      {...props}
    />
  );
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

type ControlledSelectProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
> = Omit<ControlledProps<typeof Select<Item>, Form, Name>, 'onChangeEffect'> & {
  itemToValue: (item: Item) => PathValue<Form, Name>;
  onChangeEffect?: (value: Item) => void;
};

export function ControlledSelect<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
>({ control, name, itemToValue, onChangeEffect, ...props }: ControlledSelectProps<Form, Name, Item>) {
  const {
    field: { value, onChange, ...field },
    fieldState: { invalid, error },
  } = useController({ control, name });

  const itemToValuePure = usePureFunction(itemToValue);

  const valueToItemMap = useMemo(() => {
    return new Map(
      props.items
        //
        .map((item) => [itemToValuePure(item), item] as const)
        .filter(([value]) => value !== null),
    );
  }, [props.items, itemToValuePure]);

  return (
    <Select
      {...field}
      invalid={invalid}
      helperText={error?.message}
      selectedItem={valueToItemMap.get(value) ?? null}
      onSelectedItemChange={(item) => {
        onChange(itemToValue(item) ?? null);
        onChangeEffect?.(item);
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
>({
  control,
  name,
  allItems,
  itemToValue,
  onChangeEffect,
  ...props
}: ControlledAutocompleteProps<Form, Name, Item>) {
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
      invalid={invalid}
      helperText={error?.message}
      selectedItem={valueToItemMap.get(value) ?? null}
      onSelectedItemChange={(item) => {
        onChange(itemToValue(item));
        onChangeEffect?.(item);
      }}
      {...props}
    />
  );
}
