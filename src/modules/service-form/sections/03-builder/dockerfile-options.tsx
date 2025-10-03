import { useController } from 'react-hook-form';

import { ControlledCheckbox } from 'src/components/controlled';
import { OverridableInput } from 'src/components/overridable-input';
import { ShellCommandInput } from 'src/components/shell-command-input';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.builder.dockerfileConfiguration');

export function DockerfileOptions() {
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
        label={<T id="dockerfileLocation.label" />}
        helpTooltip={<T id="dockerfileLocation.tooltip" />}
      />

      <EntrypointInput />

      <CommandInput />

      <OverridableInput
        name="builder.dockerfileOptions.target"
        label={<T id="target.label" />}
        helpTooltip={<T id="target.tooltip" />}
      />

      <OverridableInput
        name="source.git.workDirectory"
        label={<T id="workDirectory.label" />}
        helpTooltip={<T id="workDirectory.tooltip" />}
      />

      <ControlledCheckbox<ServiceForm>
        name="builder.dockerfileOptions.privileged"
        label={<T id="privileged.label" />}
        helpTooltip={<T id="privileged.tooltip" />}
      />
    </div>
  );
}

type EntrypointPath = 'builder.dockerfileOptions.entrypoint';
type CommandPath = 'builder.dockerfileOptions.command';
type ArgsPath = 'builder.dockerfileOptions.args';

function EntrypointInput() {
  const { field, fieldState } = useController<ServiceForm, EntrypointPath>({
    name: 'builder.dockerfileOptions.entrypoint',
  });

  return (
    <ShellCommandInput
      label={<T id="entrypoint.label" />}
      helpTooltip={<T id="entrypoint.tooltip" />}
      instruction="ENTRYPOINT"
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
      className="w-full max-w-md"
    />
  );
}

function CommandInput() {
  const { field: command, fieldState: commandState } = useController<ServiceForm, CommandPath>({
    name: 'builder.dockerfileOptions.command',
  });

  const { field: args, fieldState: argsState } = useController<ServiceForm, ArgsPath>({
    name: 'builder.dockerfileOptions.args',
  });

  const value = command.value === null ? null : [command.value, ...(args.value ?? [])];

  return (
    <ShellCommandInput
      label={<T id="command.label" />}
      helpTooltip={<T id="command.tooltip" />}
      instruction="CMD"
      value={value}
      onChange={(value) => {
        command.onChange(value ? (value[0] ?? '') : null);
        args.onChange(value ? value.slice(1) : null);
      }}
      error={commandState.error?.message ?? argsState.error?.message}
      className="w-full max-w-md"
    />
  );
}
