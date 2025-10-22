import { useMergeRefs } from '@floating-ui/react';
import { Input as BaseInput, Field, FieldHelperText } from '@koyeb/design-system/next';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps } from './controlled-props';
import { LabelTooltip } from './label-tooltip';

type InputProps = Extend<
  React.ComponentProps<typeof BaseInput>,
  {
    label?: React.ReactNode;
    tooltip?: React.ReactNode;
    helperText?: React.ReactNode;
    error?: React.ReactNode;
    className?: string;
    inputClassName?: string;
  }
>;

export function Input({
  label,
  tooltip,
  helperText,
  value,
  error,
  invalid = Boolean(error),
  className,
  inputClassName,
  ...props
}: InputProps) {
  return (
    <Field
      id={props.id}
      label={<LabelTooltip label={label} tooltip={tooltip} />}
      helperText={<FieldHelperText invalid={invalid}>{error ?? helperText}</FieldHelperText>}
      className={className}
    >
      <BaseInput
        value={Number.isNaN(value) ? '' : value}
        invalid={invalid}
        className={inputClassName}
        {...props}
      />
    </Field>
  );
}

export function ControlledInput<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>(props: ControlledProps<typeof Input, Form, Name>) {
  const { ref, control, name, helperText, onChangeEffect, ...rest } = props;
  const { field, fieldState } = useController({ control, name });

  const mergedRefs = useMergeRefs([ref, field.ref]);

  return (
    <Input
      {...field}
      ref={mergedRefs}
      invalid={fieldState.invalid}
      helperText={fieldState.error?.message ?? helperText}
      value={Number.isNaN(field.value) ? '' : (field.value ?? '')}
      onChange={(event) => {
        field.onChange(props.type === 'number' ? event.target.valueAsNumber : event.target.value);
        onChangeEffect?.(event);
      }}
      {...rest}
    />
  );
}
