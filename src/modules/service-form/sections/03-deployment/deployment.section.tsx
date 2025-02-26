import { useController } from 'react-hook-form';

import { Input } from '@koyeb/design-system';
import { formatCommand, parseCommand } from 'src/application/parse-command';
import { ControlledCheckbox } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { OverridableField } from '../../components/overridable-input';
import { ServiceFormSection } from '../../components/service-form-section';
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
    <OverridableField
      override={field.value !== null}
      onOverride={(override) => field.onChange(override ? [] : null)}
    >
      {(disabled) => (
        <Input
          label={<T id="entrypointLabel" />}
          helpTooltip={<T id="entrypointTooltip" />}
          placeholder={t('entrypointPlaceholder')}
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
  const t = T.useTranslate();

  const command = useController<ServiceForm, 'dockerDeployment.command'>({
    name: 'dockerDeployment.command',
  });

  const args = useController<ServiceForm, 'dockerDeployment.args'>({
    name: 'dockerDeployment.args',
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
          placeholder={t('commandPlaceholder')}
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
