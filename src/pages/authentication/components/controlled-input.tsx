import clsx from 'clsx';
import { FieldValues, FieldPath, Control, useController } from 'react-hook-form';

type ControlledInputProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
> = React.ComponentProps<'input'> & {
  control?: Control<Form>;
  name: Name;
  start?: React.ReactNode;
  end?: React.ReactNode;
};

export function ControlledInput<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
>({ control, name, start, end, className, ...props }: ControlledInputProps<Form, Name>) {
  const {
    field,
    fieldState: { invalid, error },
  } = useController({ control, name });

  return (
    <div>
      <div
        className={clsx(
          'row items-center overflow-hidden rounded-xl border bg-muted/80 focus:border-green',
          !invalid && 'border-transparent',
          invalid && 'border-red bg-red/5',
        )}
      >
        {start}

        <input
          className={clsx('w-full bg-transparent px-4 py-5 outline-none', className)}
          aria-invalid={invalid}
          {...field}
          {...props}
        />

        {end}
      </div>

      {error && <div className="ms-4 mt-1 text-xs font-medium text-red">{error.message}</div>}
    </div>
  );
}
