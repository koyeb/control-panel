import { InputEnd } from '@koyeb/design-system';
import { useFormContext, useFormState } from 'react-hook-form';

import { ControlledCheckbox, ControlledInput } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { Scaling, ServiceForm } from '../../service-form.types';

import { ScalingConfigValue } from './components/scaling-config-value';
import { ScalingConfigSection, ScalingConfigSectionFooter } from './components/scaling-section';

const T = createTranslate('modules.serviceForm.scaling.autoscaling');

type AutoscalingConfigurationProps = {
  hasVolumes: boolean;
  disabled: boolean;
};

export function AutoscalingConfiguration({ hasVolumes, disabled }: AutoscalingConfigurationProps) {
  const { watch } = useFormContext<ServiceForm>();
  const isWorker = watch('serviceType') === 'worker';

  const { errors } = useFormState<ServiceForm>();

  const hasError = [
    errors.scaling?.message,
    errors.scaling?.targets?.cpu?.value?.message,
    errors.scaling?.targets?.memory?.value?.message,
    errors.scaling?.targets?.requests?.value?.message,
    errors.scaling?.targets?.concurrentRequests?.value?.message,
    errors.scaling?.targets?.responseTime?.value?.message,
  ].some(Boolean);

  return (
    <ScalingConfigSection
      title={<T id="title" />}
      description={<T id="description" />}
      footer={<AutoscalingFooter disabled={disabled} hasVolumes={hasVolumes} />}
      hasError={hasError}
    >
      <AutoscalingTarget target="requests" disabled={disabled || isWorker} />
      <AutoscalingTarget target="concurrentRequests" disabled={disabled || isWorker} />
      <AutoscalingTarget target="responseTime" disabled={disabled || isWorker} />
      <AutoscalingTarget target="cpu" disabled={disabled} />
      <AutoscalingTarget target="memory" disabled={disabled} />
    </ScalingConfigSection>
  );
}

function AutoscalingFooter({ disabled, hasVolumes }: { disabled: boolean; hasVolumes: boolean }) {
  const { errors } = useFormState<ServiceForm>();

  if (errors.scaling?.message === 'noTargetSelected') {
    return <ScalingConfigSectionFooter variant="error" text={<T id="noTargetSelected" />} />;
  }

  if (hasVolumes) {
    return <ScalingConfigSectionFooter text={<T id="hasVolumes" />} />;
  }

  if (disabled) {
    return <ScalingConfigSectionFooter text={<T id="disabled" />} />;
  }

  return null;
}

function AutoscalingTarget({ target, disabled }: { target: keyof Scaling['targets']; disabled: boolean }) {
  const { watch } = useFormContext<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling?.targets?.[target]?.value?.message;

  return (
    <ScalingConfigValue
      disabled={disabled}
      label={
        <ControlledCheckbox<ServiceForm>
          name={`scaling.targets.${target}.enabled`}
          label={<T id={`${target}.label`} />}
          disabled={disabled}
        />
      }
      description={
        <T id={`${target}.description`} values={{ value: watch(`scaling.targets.${target}.value`) }} />
      }
      error={error}
      input={
        <ControlledInput<ServiceForm>
          name={`scaling.targets.${target}.value`}
          type="number"
          disabled={disabled}
          error={false}
          end={
            <InputEnd>
              <T id={`${target}.unit`} />
            </InputEnd>
          }
          className="max-w-24"
        />
      }
    />
  );
}
