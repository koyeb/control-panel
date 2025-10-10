import { useController } from 'react-hook-form';

import { ControlledCheckbox } from 'src/components/controlled';
import { ShellCommandInput } from 'src/components/shell-command-input';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { DockerDeploymentOptions, ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.deployment');

export function DeploymentSection() {
  return (
    <ServiceFormSection
      section="deployment"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
      className="col gaps"
    >
      <EntrypointInput />

      <CommandInput />

      <ControlledCheckbox<ServiceForm>
        name="dockerDeployment.privileged"
        label={<T id="privilegedLabel" />}
        tooltip={<T id="privilegedTooltip" />}
      />
    </ServiceFormSection>
  );
}

function Summary() {
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
      tooltip={<T id="entrypointTooltip" />}
      placeholder={t('entrypointPlaceholder')}
      instruction="ENTRYPOINT"
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
      className="w-full max-w-md"
    />
  );
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
      tooltip={<T id="commandTooltip" />}
      placeholder={t('commandPlaceholder')}
      instruction="CMD"
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
