import { Switch as BaseSwitch, SwitchLabel } from '@koyeb/design-system/next';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './controlled-props';

type SwitchProps = Extend<
  React.ComponentProps<typeof BaseSwitch>,
  {
    label?: React.ReactNode;
  }
>;

export function Switch({ label, className, ...props }: SwitchProps) {
  return (
    <SwitchLabel disabled={props.disabled} className={className}>
      <BaseSwitch {...props} />
      {label}
    </SwitchLabel>
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
