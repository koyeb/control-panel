import { useFormContext } from 'react-hook-form';

import { useInstance } from 'src/api/hooks/catalog';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { AutoScalingConfiguration } from './auto-scaling-configuration';
import { FixedScalingConfiguration } from './fixed-scaling-configuration';
import { ScalingAlerts } from './scaling-alerts';

const T = createTranslate('modules.serviceForm.scaling');

export function ScalingSection() {
  const { watch } = useFormContext<ServiceForm>();

  const hasVolumes = watch('volumes').filter((volume) => volume.name !== '').length > 0;
  const instance = useInstance(watch('instance'));
  const scaling = watch('scaling');

  return (
    <ServiceFormSection
      section="scaling"
      title={<SectionTitle />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gap-6"
    >
      <ScalingAlerts />

      {hasVolumes || (scaling.min === scaling.max && instance?.category === 'eco') ? (
        <FixedScalingConfiguration />
      ) : (
        <AutoScalingConfiguration />
      )}
    </ServiceFormSection>
  );
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
