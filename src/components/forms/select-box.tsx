import { SelectBox } from '@koyeb/design-system';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { ControlledProps } from './controlled-props';

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
