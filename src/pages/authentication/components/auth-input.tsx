import { cva } from 'class-variance-authority';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';

import { useId } from '@koyeb/design-system';

type AuthInputProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
> = React.ComponentProps<'input'> & {
  control?: Control<Form>;
  name: Name;
};

export function AuthInput<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, className, ...props }: AuthInputProps<Form, Name>) {
  const id = useId(props.id);
  const helperTextId = `${id}-helper-text`;

  const {
    field,
    fieldState: { invalid, error },
  } = useController({ control, name });

  return (
    <div className="text-start">
      <input
        aria-invalid={invalid}
        aria-errormessage={helperTextId}
        className={AuthInput.class({ invalid, className })}
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

AuthInput.class = cva(['w-full rounded-md border border-[#9F9F9F] bg-white/40 px-3 py-2 transition-colors'], {
  variants: {
    invalid: {
      true: 'border-red',
      false: 'focus:border-black',
    },
  },
});
