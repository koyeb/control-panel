import { FieldPath, useFormContext } from 'react-hook-form';

import { Switch } from '@koyeb/design-system';
import { ControlledInput } from 'src/components/controlled';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../service-form.types';

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

type OverridableInputProps = {
  name: FieldPath<ServiceForm>;
  label: React.ReactNode;
  helpTooltip?: React.ReactNode;
  placeholder?: string;
};

export function OverridableInput({ name, label, helpTooltip, placeholder }: OverridableInputProps) {
  const { watch, setValue } = useFormContext<ServiceForm>();

  return (
    <OverridableField
      override={watch(name) !== null}
      onOverride={(override) => setValue(name, override ? '' : null)}
    >
      {(disabled) => (
        <ControlledInput
          name={name}
          label={label}
          helpTooltip={helpTooltip}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full max-w-md"
        />
      )}
    </OverridableField>
  );
}
