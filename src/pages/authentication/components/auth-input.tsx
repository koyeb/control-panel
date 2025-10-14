import { useId } from '@koyeb/design-system';
import { cva } from 'class-variance-authority';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';

type AuthInputProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
> = React.ComponentProps<'input'> & {
  control?: Control<Form>;
  name: Name;
  onChangeEffect?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function AuthInput<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, onChangeEffect, className, ...props }: AuthInputProps<Form, Name>) {
  const id = useId(props.id);
  const helperTextId = `${id}-helper-text`;

  const {
    field: { onChange, ...field },
    fieldState: { invalid, error },
  } = useController({ control, name });

  return (
    <div className="text-start">
      <input
        aria-invalid={invalid}
        aria-errormessage={helperTextId}
        className={AuthInput.class({ invalid, className })}
        onChange={(event) => {
          onChange(event);
          onChangeEffect?.(event);
        }}
        {...field}
        {...props}
      />

      {invalid && (
        <div id={helperTextId} className="mt-1 text-xs text-red">
          {error?.message}
        </div>
      )}
    </div>
  );
}

AuthInput.class = cva(['w-full rounded-md border border-zinc-400 bg-white/40 px-3 py-2 transition-colors'], {
  variants: {
    invalid: {
      true: 'border-red',
      false: 'focus:border-black',
    },
  },
});
