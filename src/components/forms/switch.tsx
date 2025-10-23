import { Switch as BaseSwitch, InlineField } from '@koyeb/design-system';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './helpers/controlled-props';
import { LabelTooltip } from './label-tooltip';

type SwitchProps = Extend<
  React.ComponentProps<typeof BaseSwitch>,
  {
    label?: React.ReactNode;
    tooltip?: React.ReactNode;
  }
>;

export function Switch({ label, tooltip, className, ...props }: SwitchProps) {
  return (
    <InlineField className={className}>
      <BaseSwitch {...props} />
      <LabelTooltip as="span" label={label} tooltip={tooltip} disabled={props.disabled} />
    </InlineField>
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
