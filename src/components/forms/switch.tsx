import { Switch } from '@koyeb/design-system';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { ControlledProps } from './controlled-props';

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
