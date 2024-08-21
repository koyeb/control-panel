import clsx from 'clsx';
import { forwardRef } from 'react';

import { Field, FieldHelperText, FieldLabel } from '../field/field';
import { useId } from '../utils/use-id';

type TextAreaOwnProps = {
  label?: React.ReactNode;
  placeholder?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  invalid?: boolean;
  textAreaClassName?: string;
};

type TextAreaProps = TextAreaOwnProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof TextAreaOwnProps>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, placeholder, helperText, error, invalid = Boolean(error), className, textAreaClassName, ...props },
  ref,
) {
  const id = useId(props.id);
  const helperTextId = `${id}-error-text`;

  return (
    <Field
      className={className}
      label={<FieldLabel htmlFor={id}>{label}</FieldLabel>}
      helperText={
        <FieldHelperText id={helperTextId} invalid={invalid}>
          {error ?? helperText}
        </FieldHelperText>
      }
    >
      <textarea
        ref={ref}
        id={id}
        aria-invalid={invalid}
        aria-errormessage={invalid ? helperTextId : undefined}
        className={clsx(
          'focusable w-full rounded border bg-inherit p-2 -outline-offset-1',
          'placeholder:text-placeholder',
          'disabled:opacity-50',
          invalid && 'border-red outline-red',
          textAreaClassName,
        )}
        placeholder={typeof placeholder === 'string' ? placeholder : undefined}
        {...props}
      />
    </Field>
  );
});
