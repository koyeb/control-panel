import { Radio as BaseRadio, RadioLabel } from '@koyeb/design-system/next';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './controlled-props';
import { LabelTooltip } from './label-tooltip';

type RadioProps = Extend<
  React.ComponentProps<typeof BaseRadio>,
  {
    label?: React.ReactNode;
  }
>;

export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <RadioLabel disabled={props.disabled} className={className}>
      <BaseRadio {...props} />
      {label}
    </RadioLabel>
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
