import clsx from 'clsx';
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
        className={clsx(
          'w-full rounded-md border border-[#9F9F9F] bg-white/40 px-3 py-2',
          'transition-colors focus:border-black',
          className,
        )}
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
