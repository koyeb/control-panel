import { Checkbox as BaseCheckbox, InlineField } from '@koyeb/design-system';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './helpers/controlled-props';
import { LabelTooltip } from './label-tooltip';

type CheckboxProps = Extend<
  React.ComponentProps<typeof BaseCheckbox>,
  {
    label?: React.ReactNode;
    tooltip?: React.ReactNode;
  }
>;

export function Checkbox({ label, tooltip, className, ...props }: CheckboxProps) {
  return (
    <InlineField className={className}>
      <BaseCheckbox {...props} />
      <LabelTooltip as="span" label={label} tooltip={tooltip} disabled={props.disabled} />
    </InlineField>
  );
}

export function ControlledCheckbox<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>(props: ControlledProps<typeof Checkbox, Form, Name> & { tooltip?: React.ReactNode }) {
  const { control, name, onChangeEffect, ...rest } = props;
  const { field } = useController({ control, name });

  return (
    <Checkbox
      {...field}
      checked={field.value}
      onChange={(event) => {
        field.onChange(event);
        onChangeEffect?.(event);
      }}
      {...rest}
    />
  );
}
