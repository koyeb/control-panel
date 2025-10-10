import { Switch } from '@koyeb/design-system';
import { FieldPathByValue, FieldValues, useController } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
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
        className="mt-6"
        label={<Translate id="common.override" />}
        labelPosition="left"
        checked={override}
        onChange={(event) => onOverride(event.target.checked)}
      />
    </div>
  );
}

type OverridableInputProps<
  TFieldValues extends FieldValues,
  Name extends FieldPathByValue<TFieldValues, string | null>,
> = {
  name: Name;
  label: React.ReactNode;
  tooltip?: React.ReactNode;
  placeholder?: string;
};

export function OverridableInput<
  TFieldValues extends FieldValues,
  Name extends FieldPathByValue<TFieldValues, string | null>,
>({ name, label, tooltip, placeholder }: OverridableInputProps<TFieldValues, Name>) {
  const { field } = useController<TFieldValues, Name>({ name });

  return (
    <OverridableField
      override={field.value !== null}
      onOverride={(override) => field.onChange(override ? '' : null)}
    >
      {(disabled) => (
        <ControlledInput
          name={name}
          label={label}
          tooltip={tooltip}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full max-w-md"
        />
      )}
    </OverridableField>
  );
}
