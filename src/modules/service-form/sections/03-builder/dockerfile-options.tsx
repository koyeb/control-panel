import { useController } from 'react-hook-form';

import { Input } from '@koyeb/design-system';
import { formatCommand, parseCommand } from 'src/application/parse-command';
import { ControlledCheckbox } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { OverridableField, OverridableInput } from '../../components/overridable-input';
import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.builder.dockerfileConfiguration');

export function DockerfileOptions() {
  const t = T.useTranslate();

  return (
    <div className="col gaps">
      <div className="col gap-2">
        <div className="font-semibold">{<T id="title" />}</div>
        <div className="text-dim">
          <T id="description" />
        </div>
      </div>

      <OverridableInput
        name="builder.dockerfileOptions.dockerfile"
        label={<T id="dockerfileLocationLabel" />}
        helpTooltip={<T id="dockerfileLocationTooltip" />}
        placeholder={t('dockerfileLocationPlaceholder')}
      />

      <EntrypointInput />

      <CommandInput />

      <OverridableInput
        name="builder.dockerfileOptions.target"
        label={<T id="targetLabel" />}
        helpTooltip={<T id="targetTooltip" />}
      />

      <OverridableInput
        name="source.git.workDirectory"
        label={<T id="workDirectoryLabel" />}
        helpTooltip={<T id="workDirectoryTooltip" />}
        placeholder={t('workDirectoryPlaceholder')}
      />

      <ControlledCheckbox<ServiceForm>
        name="builder.dockerfileOptions.privileged"
        label={<T id="privilegedLabel" />}
        helpTooltip={<T id="privilegedTooltip" />}
      />
    </div>
  );
}

function EntrypointInput() {
  const { field, fieldState } = useController<ServiceForm, 'builder.dockerfileOptions.entrypoint'>({
    name: 'builder.dockerfileOptions.entrypoint',
  });

  return (
    <OverridableField
      override={field.value !== null}
      onOverride={(override) => field.onChange(override ? [] : null)}
    >
      {(disabled) => (
        <Input
          label={<T id="entrypointLabel" />}
          helpTooltip={<T id="entrypointTooltip" />}
          disabled={disabled}
          defaultValue={formatCommand(field.value ?? [])}
          onChange={(event) => field.onChange(parseCommand(event.target.value))}
          error={fieldState.error?.message}
          className="w-full max-w-md"
        />
      )}
    </OverridableField>
  );
}

function CommandInput() {
  const command = useController<ServiceForm, 'builder.dockerfileOptions.command'>({
    name: 'builder.dockerfileOptions.command',
  });

  const args = useController<ServiceForm, 'builder.dockerfileOptions.args'>({
    name: 'builder.dockerfileOptions.args',
  });

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const parsed = parseCommand(event.target.value);

    command.field.onChange(parsed[0] ?? '');
    args.field.onChange(parsed.slice(1));
  };

  return (
    <OverridableField
      override={command.field.value !== null}
      onOverride={(override) => {
        command.field.onChange(override ? '' : null);
        args.field.onChange(override ? [] : null);
      }}
    >
      {(disabled) => (
        <Input
          label={<T id="commandLabel" />}
          helpTooltip={<T id="commandTooltip" />}
          disabled={disabled}
          defaultValue={formatCommand([command.field.value ?? '', ...(args.field.value ?? [])])}
          onChange={handleChange}
          error={command.fieldState.error?.message ?? args.fieldState.error?.message}
          className="w-full max-w-md"
        />
      )}
    </OverridableField>
  );
}
