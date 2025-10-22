import { Radio } from '@koyeb/design-system';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { ControlledProps } from './controlled-props';
import { LabelTooltip } from './label-tooltip';

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
