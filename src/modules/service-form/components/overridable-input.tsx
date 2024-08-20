import { FieldPath, useFormContext } from 'react-hook-form';

import { Switch } from '@koyeb/design-system';
import { ControlledInput, ControlledStringArrayInput } from 'src/components/controlled';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../service-form.types';
import { useWatchServiceForm } from '../use-service-form';

type OverridableInputProps = {
  name: FieldPath<ServiceForm>;
  label: React.ReactNode;
  helpTooltip?: React.ReactNode;
  placeholder?: string;
};

export function OverridableInput({ name, label, helpTooltip, placeholder }: OverridableInputProps) {
  const value = useWatchServiceForm(name) as string | null;
  const { setValue } = useFormContext<ServiceForm>();

  return (
    <OverridableField
      override={value !== null}
      onOverride={(override) => setValue(name, override ? '' : null)}
    >
      <ControlledInput
        name={name}
        label={label}
        helpTooltip={helpTooltip}
        placeholder={placeholder}
        disabled={value === null}
        value={value ?? ''}
        className="w-full max-w-md"
      />
    </OverridableField>
  );
}

type OverridableInputArrayProps = {
  name: FieldPath<ServiceForm>;
  label: React.ReactNode;
  helpTooltip?: React.ReactNode;
  placeholder?: string;
};

export function OverridableInputArray({ name, label, helpTooltip, placeholder }: OverridableInputArrayProps) {
  const value = useWatchServiceForm(name) as string[] | null;
  const { setValue } = useFormContext<ServiceForm>();

  return (
    <OverridableField
      override={value !== null}
      onOverride={(override) => setValue(name, override ? [] : null)}
    >
      <ControlledStringArrayInput
        name={name}
        label={label}
        helpTooltip={helpTooltip}
        placeholder={placeholder}
        disabled={value === null}
        value={value ?? []}
        className="w-full max-w-md"
      />
    </OverridableField>
  );
}

type OverridableFieldProps = {
  override: boolean;
  onOverride: (override: boolean) => void;
  children: React.ReactNode;
};

function OverridableField({ override, onOverride, children }: OverridableFieldProps) {
  return (
    <div className="row gap-4">
      {children}

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
