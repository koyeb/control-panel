import { TextArea as BaseTextArea, Field, FieldHelperText } from '@koyeb/design-system/next';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './controlled-props';
import { LabelTooltip } from './label-tooltip';

type TextAreaProps = Extend<
  React.ComponentProps<typeof BaseTextArea>,
  {
    label?: React.ReactNode;
    tooltip?: React.ReactNode;
    helperText?: React.ReactNode;
    error?: React.ReactNode;
    className?: string;
    textAreaClassName?: string;
  }
>;

export function TextArea({
  label,
  tooltip,
  helperText,
  error,
  invalid = Boolean(error),
  className,
  textAreaClassName,
  ...props
}: TextAreaProps) {
  return (
    <Field
      id={props.id}
      label={<LabelTooltip label={label} tooltip={tooltip} />}
      helperText={<FieldHelperText invalid={invalid}>{helperText}</FieldHelperText>}
      className={className}
    >
      <BaseTextArea invalid={invalid} className={textAreaClassName} {...props} />
    </Field>
  );
}

export function ControlledTextArea<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, onChangeEffect, ...props }: ControlledProps<typeof TextArea, Form, Name>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <TextArea
      {...field}
      invalid={fieldState.invalid}
      helperText={fieldState.error?.message}
      value={field.value}
      onChange={(event) => {
        field.onChange(event.target.value);
        onChangeEffect?.(event);
      }}
      {...props}
    />
  );
}
