import { ControlledCheckbox } from 'src/components/controlled';
import { OverridableInput } from 'src/components/overridable-input';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.builder.buildpackConfiguration');

export function BuildpackOptions() {
  const t = T.useTranslate();

  return (
    <div className="col gaps">
      <div className="col gap-2">
        <div className="font-semibold">{<T id="title" />}</div>
        <div className="text-dim">
          <T id="description" />
        </div>
      </div>

      <OverridableInput<ServiceForm, 'builder.buildpackOptions.buildCommand'>
        name="builder.buildpackOptions.buildCommand"
        label={<T id="buildCommandLabel" />}
        helpTooltip={<T id="buildCommandTooltip" />}
      />

      <OverridableInput<ServiceForm, 'builder.buildpackOptions.runCommand'>
        name="builder.buildpackOptions.runCommand"
        label={<T id="runCommandLabel" />}
        helpTooltip={<T id="runCommandTooltip" />}
      />

      <OverridableInput<ServiceForm, 'source.git.workDirectory'>
        name="source.git.workDirectory"
        label={<T id="workDirectoryLabel" />}
        helpTooltip={<T id="workDirectoryTooltip" />}
        placeholder={t('workDirectoryPlaceholder')}
      />

      <ControlledCheckbox<ServiceForm, 'builder.buildpackOptions.privileged'>
        name="builder.buildpackOptions.privileged"
        label={<T id="privilegedLabel" />}
        helpTooltip={<T id="privilegedTooltip" />}
      />
    </div>
  );
}
