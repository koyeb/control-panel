import { Radio as BaseRadio, InlineField } from '@koyeb/design-system';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './helpers/controlled-props';
import { LabelTooltip } from './label-tooltip';

type RadioProps = Extend<
  React.ComponentProps<typeof BaseRadio>,
  {
    label?: React.ReactNode;
    tooltip?: React.ReactNode;
  }
>;

export function Radio({ label, tooltip, className, ...props }: RadioProps) {
  return (
    <InlineField className={className}>
      <BaseRadio {...props} />
      <LabelTooltip as="span" label={label} tooltip={tooltip} disabled={props.disabled} />
    </InlineField>
  );
}

export function ControlledRadio<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>(props: ControlledProps<typeof Radio, Form, Name> & { tooltip?: React.ReactNode }) {
  const { control, name, value, ...rest } = props;
  const { field } = useController({ control, name });

  return (
    <Radio {...field} checked={field.value === value} onChange={() => field.onChange(value)} {...rest} />
  );
}
