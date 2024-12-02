import clsx from 'clsx';
import { forwardRef } from 'react';

import { Field, FieldHelperText, FieldLabel } from '../field/field';
import { useId } from '../utils/use-id';

type InputOwnProps = {
  size?: 1 | 2 | 3;
  label?: React.ReactNode;
  helpTooltip?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  invalid?: boolean;
  start?: React.ReactNode;
  end?: React.ReactNode;
  inputBoxClassName?: string;
  inputClassName?: string;
};

type InputProps = InputOwnProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputOwnProps>;

export const Input = forwardRef(function Input(
  {
    size,
    label,
    helpTooltip,
    helperText,
    error,
    invalid = Boolean(error),
    className,
    inputBoxClassName,
    inputClassName,
    ...props
  }: InputProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const id = useId(props.id);
  const helperTextId = `${id}-helper-text`;

  return (
    <Field
      label={
        <FieldLabel htmlFor={id} helpTooltip={helpTooltip}>
          {label}
        </FieldLabel>
      }
      helperText={
        <FieldHelperText id={helperTextId} invalid={invalid}>
          {error ?? helperText}
        </FieldHelperText>
      }
      className={className}
    >
      <InputBox
        ref={ref}
        id={id}
        size={size}
        boxClassName={inputBoxClassName}
        className={inputClassName}
        aria-invalid={invalid}
        aria-errormessage={helperTextId}
        {...props}
      />
    </Field>
  );
});

type InputBoxOwnProps = {
  boxRef?: React.Ref<HTMLDivElement>;
  boxClassName?: string;
  size?: 1 | 2 | 3;
  placeholder?: string;
  start?: React.ReactNode;
  end?: React.ReactNode;
};

type InputBoxProps = InputBoxOwnProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputBoxOwnProps>;

export const InputBox = forwardRef<HTMLInputElement, InputBoxProps>(function InputBox(
  { boxRef, boxClassName, size = 2, placeholder, value, min, max, step, start, end, id, className, ...props },
  ref,
) {
  return (
    <div
      ref={boxRef}
      className={clsx(
        'row w-full justify-stretch rounded border -outline-offset-1',
        props.disabled || props.readOnly ? 'bg-muted dark:bg-muted' : 'focusable-within',
        props.disabled && 'opacity-50',
        props['aria-invalid'] && 'border-red outline-red',
        {
          'min-h-6': size === 1,
          'min-h-8': size === 2,
          'min-h-10': size === 3,
        },
        boxClassName,
      )}
    >
      {start}

      <input
        ref={ref}
        id={id}
        className={clsx(
          'w-full min-w-0 flex-1 rounded bg-inherit px-2 outline-none',
          'placeholder:text-placeholder',
          start && 'rounded-s-none',
          end && 'rounded-e-none',
          className,
        )}
        value={Number.isNaN(value) ? '' : value}
        min={Number.isNaN(min) ? undefined : min}
        max={Number.isNaN(max) ? undefined : max}
        step={Number.isNaN(step) ? undefined : step}
        placeholder={placeholder}
        {...props}
      />

      {end}
    </div>
  );
});

type InputStartProps = {
  children: React.ReactNode;
};

export function InputStart({ children }: InputStartProps) {
  return <span className="row items-center rounded-s border-e bg-muted px-2">{children}</span>;
}

type InputEndProps = {
  children: React.ReactNode;
};

export function InputEnd({ children }: InputEndProps) {
  return <span className="row items-center rounded-e border-s bg-muted px-2">{children}</span>;
}
