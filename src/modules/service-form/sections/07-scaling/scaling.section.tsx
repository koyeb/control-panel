import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { SelectBox } from '@koyeb/design-system';
import { useInstance } from 'src/api/hooks/catalog';
import { IconMoveHorizontal, IconScaling } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { AutoScalingConfiguration } from './auto-scaling-configuration';
import { FixedScalingConfiguration } from './fixed-scaling-configuration';
import { ScalingAlerts } from './scaling-alerts';

const T = Translate.prefix('serviceForm.scaling');

export function ScalingSection() {
  const instance = useInstance(useWatchServiceForm('instance'));
  const scaling = useWatchServiceForm('scaling');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;

  const canSelectFixedScaling = !hasVolumes && instance?.identifier !== 'free';
  const canSelectAutoscaling = !hasVolumes && instance?.category !== 'eco';

  useUpdateScalingWhenInstanceSelected();

  return (
    <ServiceFormSection
      section="scaling"
      title={<SectionTitle />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gap-6"
    >
      <ScalingAlerts />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller<ServiceForm, 'scaling'>
          name="scaling"
          render={({ field }) => (
            <>
              <SelectBox
                name={field.name}
                type="radio"
                icon={<IconMoveHorizontal className="icon" />}
                title={<T id="fixed" />}
                description={<T id="fixedDescription" />}
                disabled={!canSelectFixedScaling}
                checked={field.value.min === field.value.max}
                onChange={() => field.onChange({ ...field.value, max: field.value.min })}
              />

              <SelectBox
                name={field.name}
                value="autoscaling"
                type="radio"
                icon={<IconScaling className="icon" />}
                title={<T id="autoscaling" />}
                description={<T id="autoscalingDescription" />}
                disabled={!canSelectAutoscaling}
                checked={field.value.min !== field.value.max}
                onChange={() => field.onChange({ ...field.value, min: 1, max: 3 })}
              />
            </>
          )}
        />
      </div>

      {scaling.min === scaling.max ? <FixedScalingConfiguration /> : <AutoScalingConfiguration />}
    </ServiceFormSection>
  );
}

function useUpdateScalingWhenInstanceSelected() {
  const { setValue, getValues } = useFormContext<ServiceForm>();
  const instance = useInstance(useWatchServiceForm('instance'));

  useEffect(() => {
    if (instance?.category === 'eco') {
      setValue('scaling.max', getValues('scaling.min'));
    }

    if (instance?.identifier === 'free') {
      setValue('scaling.min', 1);
      setValue('scaling.max', 1);
    }
  }, [instance, setValue, getValues]);
}

const SectionTitle = () => {
  const scaling = useWatchServiceForm('scaling');
  const fixedScaling = scaling.min === scaling.max;

  return (
    <div className="row gap-1">
      <T id={fixedScaling ? 'fixed' : 'autoscaling'} />
      <span className="font-normal text-dim">
        {fixedScaling ? (
          <T id="instancePerRegion" values={{ value: scaling.min }} />
        ) : (
          <T id="instancesPerRegion" values={{ min: scaling.min, max: scaling.max }} />
        )}
      </span>
    </div>
  );
};
