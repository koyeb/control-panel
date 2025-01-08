import { ControlledCheckbox } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { OverridableInput, OverridableInputArray } from '../../components/overridable-input';
import { ServiceFormSection } from '../../components/service-form-section';
import { DockerDeploymentOptions, ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.deployment');

export function DeploymentSection() {
  const t = T.useTranslate();

  return (
    <ServiceFormSection
      section="deployment"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      description={<T id="description" />}
      className="col gaps"
    >
      <OverridableInputArray
        name="dockerDeployment.entrypoint"
        label={<T id="entrypointLabel" />}
        helpTooltip={<T id="entrypointTooltip" />}
        placeholder={t('entrypointPlaceholder')}
      />

      <OverridableInput
        name="dockerDeployment.command"
        label={<T id="commandLabel" />}
        helpTooltip={<T id="commandTooltip" />}
        placeholder={t('commandPlaceholder')}
      />

      <OverridableInputArray
        name="dockerDeployment.args"
        label={<T id="argsLabel" />}
        helpTooltip={<T id="argsTooltip" />}
        placeholder={t('argsPlaceholder')}
      />

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
