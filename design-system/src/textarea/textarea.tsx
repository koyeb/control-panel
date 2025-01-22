import clsx from 'clsx';

import { Field, FieldHelperText, FieldLabel } from '../field/field';
import { Extend } from '../utils/types';
import { useId } from '../utils/use-id';

type TextAreaOwnProps = {
  label?: React.ReactNode;
  placeholder?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  invalid?: boolean;
  textAreaClassName?: string;
};

type TextAreaProps = Extend<React.ComponentProps<'textarea'>, TextAreaOwnProps>;

export function TextArea({
  label,
  placeholder,
  helperText,
  error,
  invalid = Boolean(error),
  className,
  textAreaClassName,
  ...props
}: TextAreaProps) {
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
        id={id}
        aria-invalid={invalid}
        aria-errormessage={invalid ? helperTextId : undefined}
        className={clsx(
          'focusable w-full rounded border bg-inherit px-2 py-1.5 -outline-offset-1',
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
}
