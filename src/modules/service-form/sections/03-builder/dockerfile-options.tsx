import { ControlledCheckbox } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { OverridableInput, OverridableInputArray } from '../../components/overridable-input';
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

      <OverridableInputArray
        name="builder.dockerfileOptions.entrypoint"
        label={<T id="entrypointLabel" />}
        helpTooltip={<T id="entrypointTooltip" />}
      />

      <OverridableInput
        name="builder.dockerfileOptions.command"
        label={<T id="commandLabel" />}
        helpTooltip={<T id="commandTooltip" />}
      />

      <OverridableInputArray
        name="builder.dockerfileOptions.args"
        label={<T id="argsLabel" />}
        helpTooltip={<T id="argsTooltip" />}
      />

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
