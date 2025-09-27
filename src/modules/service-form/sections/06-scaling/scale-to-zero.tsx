import { Badge, Button, InputEnd } from '@koyeb/design-system';
import { useFormContext, useFormState } from 'react-hook-form';

import { useCatalogInstance, useOrganization } from 'src/api';
import { ControlledCheckbox, ControlledInput } from 'src/components/controlled';
import { LinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { ScalingConfigValue } from './components/scaling-config-value';
import { ScalingConfigSection, ScalingConfigSectionFooter } from './components/scaling-section';

const T = createTranslate('modules.serviceForm.scaling.scaleToZero');

type ScaleToZeroConfigurationProps = {
  disabled: boolean;
  isEcoInstance: boolean;
  hasVolumes: boolean;
};

export function ScaleToZeroConfiguration({
  disabled,
  isEcoInstance,
  hasVolumes,
}: ScaleToZeroConfigurationProps) {
  const { watch } = useFormContext<ServiceForm>();
  const instance = useCatalogInstance(watch('instance'));
  const isGpu = instance?.category === 'gpu';

  const { errors } = useFormState<ServiceForm>();

  const hasError = [
    errors.scaling?.scaleToZero?.idlePeriod?.message,
    errors.scaling?.scaleToZero?.lightToDeepPeriod?.message,
  ].some(Boolean);

  return (
    <ScalingConfigSection
      title={<T id="title" />}
      footer={<ScaleToZeroFooter isEcoInstance={isEcoInstance} hasVolumes={hasVolumes} />}
      hasError={hasError}
    >
      <IdlePeriod disabled={disabled} />
      <LightSleep disabled={disabled || isGpu} isGpu={isGpu} />
    </ScalingConfigSection>
  );
}

function ScaleToZeroFooter({ isEcoInstance, hasVolumes }: { isEcoInstance: boolean; hasVolumes: boolean }) {
  const organization = useOrganization();
  const { watch, setValue } = useFormContext<ServiceForm>();

  if (isEcoInstance) {
    const onClick = () => setValue('meta.expandedSection', 'instance');

    const cta = (
      <Button variant="outline" color="gray" size={1} onClick={onClick} className="bg-neutral">
        <T id="disabled.ecoInstance.cta" />
      </Button>
    );

    return <ScalingConfigSectionFooter text={<T id="disabled.ecoInstance.text" />} cta={cta} />;
  }

  if (hasVolumes) {
    return <ScalingConfigSectionFooter text={<T id="disabled.hasVolumes.text" />} />;
  }

  if (watch('scaling.min') === 0 && organization?.plan === 'starter') {
    const cta = (
      <LinkButton to="/settings/plans" variant="outline" color="gray" size={1} className="bg-neutral">
        <T id="disabled.starterPlan.cta" />
      </LinkButton>
    );

    return <ScalingConfigSectionFooter text={<T id="disabled.starterPlan.text" />} cta={cta} />;
  }

  return null;
}

function IdlePeriod({ disabled }: { disabled: boolean }) {
  const organization = useOrganization();

  const { trigger } = useFormContext<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling?.scaleToZero?.idlePeriod?.message;

  return (
    <ScalingConfigValue
      disabled={disabled}
      label={<T id="idlePeriod.label" />}
      description={<T id="idlePeriod.description" />}
      error={error}
      padding={false}
      input={
        <ControlledInput<ServiceForm, 'scaling.scaleToZero.idlePeriod'>
          name="scaling.scaleToZero.idlePeriod"
          type="number"
          disabled={disabled || organization?.plan === 'starter'}
          error={false}
          end={
            <InputEnd>
              <T id="idlePeriod.unit" />
            </InputEnd>
          }
          onChangeEffect={() => void trigger('scaling.scaleToZero')}
          className="max-w-24"
        />
      }
    />
  );
}

function LightSleep({ disabled, isGpu }: { disabled: boolean; isGpu: boolean }) {
  const organization = useOrganization();

  const { watch, trigger } = useFormContext<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling?.scaleToZero?.lightToDeepPeriod?.message;

  return (
    <ScalingConfigValue
      disabled={disabled}
      label={
        <div className="row items-center gap-2">
          <ControlledCheckbox<ServiceForm, 'scaling.scaleToZero.lightSleepEnabled'>
            name="scaling.scaleToZero.lightSleepEnabled"
            label={<T id="lightSleep.label" />}
            disabled={disabled}
            onChangeEffect={() => void trigger('scaling.scaleToZero')}
          />

          {isGpu && (
            <Badge size={1} color="blue">
              <T id="lightSleep.disabledGpu" />
            </Badge>
          )}
        </div>
      }
      description={
        <T id="lightSleep.description" values={{ value: watch('scaling.scaleToZero.lightToDeepPeriod') }} />
      }
      error={error}
      input={
        <ControlledInput<ServiceForm, 'scaling.scaleToZero.lightToDeepPeriod'>
          name="scaling.scaleToZero.lightToDeepPeriod"
          type="number"
          disabled={!watch('scaling.scaleToZero.lightSleepEnabled') || organization?.plan === 'starter'}
          error={false}
          end={
            <InputEnd>
              <T id="lightSleep.unit" />
            </InputEnd>
          }
          onChangeEffect={() => void trigger('scaling.scaleToZero')}
          className="max-w-24"
        />
      }
    />
  );
}
