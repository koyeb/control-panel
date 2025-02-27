import { useController } from 'react-hook-form';

import { formatCommand } from 'src/application/parse-command';
import { ControlledCheckbox } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ShellCommandInput } from '../../components/shell-command-input';
import { DockerDeploymentOptions, ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.deployment');

export function DeploymentSection() {
  return (
    <ServiceFormSection
      section="deployment"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      description={<T id="description" />}
      className="col gaps"
    >
      <EntrypointInput />

      <CommandInput />

      <ControlledCheckbox<ServiceForm>
        name="dockerDeployment.privileged"
        label={<T id="privilegedLabel" />}
        helpTooltip={<T id="privilegedTooltip" />}
      />
    </ServiceFormSection>
  );
}

function SectionTitle() {
  const options = useWatchServiceForm('dockerDeployment');

  return <T id={isDefaultConfiguration(options) ? 'defaultConfiguration' : 'customConfiguration'} />;
}

function isDefaultConfiguration(options: DockerDeploymentOptions) {
  return Object.values(options).every((value) => value === null || value === false);
}

function EntrypointInput() {
  const t = T.useTranslate();

  const { field, fieldState } = useController<ServiceForm, 'dockerDeployment.entrypoint'>({
    name: 'dockerDeployment.entrypoint',
  });

  return (
    <ShellCommandInput
      label={<T id="entrypointLabel" />}
      helpTooltip={<T id="entrypointTooltip" />}
      placeholder={t('entrypointPlaceholder')}
      helperText={<EntrypointHelperText value={field.value} />}
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
      className="w-full max-w-md"
    />
  );
}

function EntrypointHelperText({ value }: { value: string[] | null }) {
  if (value === null) {
    return null;
  }

  const [command = '', ...args] = value;

  return <code>{`docker run --entrypoint ${command} [...] ${formatCommand(args)}`}</code>;
}

function CommandInput() {
  const t = T.useTranslate();

  const { field: command, fieldState: cmdState } = useController<ServiceForm, 'dockerDeployment.command'>({
    name: 'dockerDeployment.command',
  });

  const { field: args, fieldState: argsState } = useController<ServiceForm, 'dockerDeployment.args'>({
    name: 'dockerDeployment.args',
  });

  const value = command.value === null ? null : [command.value, ...(args.value ?? [])];

  return (
    <ShellCommandInput
      label={<T id="commandLabel" />}
      helpTooltip={<T id="commandTooltip" />}
      placeholder={t('commandPlaceholder')}
      helperText={<CommandHelperText value={value} />}
      value={value}
      onChange={(value) => {
        command.onChange(value ? (value[0] ?? '') : null);
        args.onChange(value ? value.slice(1) : null);
      }}
      error={cmdState.error?.message ?? argsState.error?.message}
      className="w-full max-w-md"
    />
  );
}

function CommandHelperText({ value }: { value: string[] | null }) {
  if (value === null) {
    return null;
  }

  return <code>{`docker run [...] ${formatCommand(value)}`}</code>;
}
