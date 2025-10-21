import { mergeRefs } from '@koyeb/design-system';
import { Input as BaseInput, FieldHelperText } from '@koyeb/design-system/next';
import { ComponentProps } from 'react';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { Extend } from 'src/utils/types';

import { ControlledProps, LabelTooltip } from '../controlled';

type InputProps = Extend<
  ComponentProps<typeof BaseInput>,
  {
    label?: React.ReactNode;
    tooltip?: React.ReactNode;
    helperText?: React.ReactNode;
    error?: React.ReactNode;
  }
>;

export function Input(props: InputProps) {
  const { label, tooltip, helperText, error, value, ...rest } = props;
  const invalid = props.invalid ?? Boolean(error);

  return (
    <BaseInput
      field={{
        label: <LabelTooltip label={label} tooltip={tooltip} />,
        helperText: <FieldHelperText invalid={invalid}>{error ?? helperText}</FieldHelperText>,
      }}
      value={Number.isNaN(value) ? '' : value}
      invalid={invalid}
      {...rest}
    />
  );
}

export function ControlledInput<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>(props: ControlledProps<typeof Input, Form, Name>) {
  const { ref, control, name, helperText, onChangeEffect, ...rest } = props;
  const { field, fieldState } = useController({ control, name });

  return (
    <Input
      {...field}
      ref={mergeRefs(ref, field.ref)}
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
