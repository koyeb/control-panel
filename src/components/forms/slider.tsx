import { Slider as BaseSlider, Field, FieldHelperText } from '@koyeb/design-system/next';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './controlled-props';
import { LabelTooltip } from './label-tooltip';

type SliderProps = Extend<
  React.ComponentProps<typeof BaseSlider>,
  {
    label?: React.ReactNode;
    tooltip?: React.ReactNode;
    helperText?: React.ReactNode;
    error?: React.ReactNode;
    className?: string;
  }
>;

export function Slider({ label, tooltip, helperText, error, className, ...props }: SliderProps) {
  return (
    <Field
      label={<LabelTooltip label={label} tooltip={tooltip} />}
      helperText={<FieldHelperText invalid={Boolean(error)}>{helperText}</FieldHelperText>}
      className={className}
    >
      <BaseSlider {...props} />
    </Field>
  );
}

export function ControlledSlider<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, value, ...props }: ControlledProps<typeof Slider, Form, Name>) {
  const { field } = useController({ control, name });

  return <Slider {...field} {...props} />;
}
