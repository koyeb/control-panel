import { ControlledCheckbox } from 'src/components/forms';
import { OverridableInput } from 'src/components/overridable-input';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.builder.buildpackConfiguration');

export function BuildpackOptions() {
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
        label={<T id="buildCommand.label" />}
        tooltip={<T id="buildCommand.tooltip" />}
      />

      <OverridableInput<ServiceForm, 'builder.buildpackOptions.runCommand'>
        name="builder.buildpackOptions.runCommand"
        label={<T id="runCommand.label" />}
        tooltip={<T id="runCommand.tooltip" />}
      />

      <OverridableInput<ServiceForm, 'source.git.workDirectory'>
        name="source.git.workDirectory"
        label={<T id="workDirectory.label" />}
        tooltip={<T id="workDirectory.tooltip" />}
      />

      <ControlledCheckbox<ServiceForm, 'builder.buildpackOptions.privileged'>
        name="builder.buildpackOptions.privileged"
        label={<T id="privileged.label" />}
        tooltip={<T id="privileged.tooltip" />}
      />
    </div>
  );
}
