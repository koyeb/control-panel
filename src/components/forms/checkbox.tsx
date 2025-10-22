import { Checkbox } from '@koyeb/design-system';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { ControlledProps } from './controlled-props';
import { LabelTooltip } from './label-tooltip';

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
