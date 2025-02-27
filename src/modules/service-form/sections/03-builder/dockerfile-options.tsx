import { useController } from 'react-hook-form';

import { ControlledCheckbox } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { OverridableInput } from '../../components/overridable-input';
import { ShellCommandInput } from '../../components/shell-command-input';
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

type EntrypointPath = 'builder.dockerfileOptions.entrypoint';
type CommandPath = 'builder.dockerfileOptions.command';
type ArgsPath = 'builder.dockerfileOptions.args';

function EntrypointInput() {
  const { field, fieldState } = useController<ServiceForm, EntrypointPath>({
    name: 'builder.dockerfileOptions.entrypoint',
  });

  return (
    <ShellCommandInput
      label={<T id="entrypointLabel" />}
      helpTooltip={<T id="entrypointTooltip" />}
      helperText={<HelperText instruction="ENTRYPOINT" command={field.value} />}
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
      label={<T id="commandLabel" />}
      helpTooltip={<T id="commandTooltip" />}
      helperText={<HelperText instruction="CMD" command={value} />}
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

type HelperTextProps = {
  instruction: string;
  command: string[] | null;
};

function HelperText({ instruction, command }: HelperTextProps) {
  if (command === null) {
    return null;
  }

  return <code>{`${instruction} [${command.map((value) => `"${value}"`).join(', ')}]`}</code>;
}
