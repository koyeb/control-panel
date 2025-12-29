import clsx from 'clsx';
import { FieldPathByValue, FieldValues, useController } from 'react-hook-form';

import { ControlledInput, Switch } from 'src/components/forms';
import { Translate } from 'src/intl/translate';

type OverridableFieldProps = {
  override: boolean;
  onOverride: (override: boolean) => void;
  children: (disabled: boolean) => React.ReactNode;
};

export function OverridableField({ override, onOverride, children }: OverridableFieldProps) {
  return (
    <div className="row items-start gap-4">
      {children(!override)}

      <Switch
        className="mt-8 flex-row items-center"
        label={<Translate id="common.override" />}
        checked={override}
        onChange={(event) => onOverride(event.target.checked)}
      />
    </div>
  );
}

type OverridableInputProps<
  TFieldValues extends FieldValues,
  Name extends FieldPathByValue<TFieldValues, string | number | null>,
> = React.ComponentProps<typeof ControlledInput<TFieldValues, Name>>;

export function OverridableInput<
  TFieldValues extends FieldValues,
  Name extends FieldPathByValue<TFieldValues, string | number | null>,
>({ className, ...props }: OverridableInputProps<TFieldValues, Name>) {
  const { field } = useController<TFieldValues, Name>({ name: props.name });

  const getValue = (override: boolean) => {
    if (!override) {
      return null;
    }

    if (props.type === 'number') {
      return NaN;
    }

    return '';
  };

  return (
    <OverridableField
      override={field.value !== null}
      onOverride={(override) => field.onChange(getValue(override))}
    >
      {(disabled) => (
        <ControlledInput {...props} disabled={disabled} className={clsx('w-full max-w-md', className)} />
      )}
    </OverridableField>
  );
}
