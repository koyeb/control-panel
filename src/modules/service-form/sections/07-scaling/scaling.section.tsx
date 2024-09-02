import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { ControlledSelectBox } from 'src/components/controlled';
import { IconScaling, IconMoveHorizontal } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { AutoScalingConfiguration } from './auto-scaling-configuration';
import { FixedScalingConfiguration } from './fixed-scaling-configuration';
import { ScalingAlerts } from './scaling-alerts';

const T = Translate.prefix('serviceForm.scaling');

export function ScalingSection() {
  const instance = useWatchServiceForm('instance');
  const scaling = useWatchServiceForm('scaling');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.volumeId !== '').length > 0;

  const canSelectFixedScaling = !hasVolumes && instance.identifier !== 'free';
  const canSelectAutoscaling = !hasVolumes && instance.category !== 'eco';

  useDisableRequestsWhenWorkerSelected();
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
        <ControlledSelectBox<ServiceForm>
          name="scaling.type"
          value="fixed"
          type="radio"
          icon={<IconMoveHorizontal className="icon" />}
          title={<T id="fixed" />}
          description={<T id="fixedDescription" />}
          disabled={!canSelectFixedScaling}
        />

        <ControlledSelectBox<ServiceForm>
          name="scaling.type"
          value="autoscaling"
          type="radio"
          icon={<IconScaling className="icon" />}
          title={<T id="autoscaling" />}
          description={<T id="autoscalingDescription" />}
          disabled={!canSelectAutoscaling}
        />
      </div>

      {scaling.type === 'fixed' && <FixedScalingConfiguration />}
      {scaling.type === 'autoscaling' && <AutoScalingConfiguration />}
    </ServiceFormSection>
  );
}

function useDisableRequestsWhenWorkerSelected() {
  const { setValue, trigger } = useFormContext<ServiceForm>();
  const serviceType = useWatchServiceForm('serviceType');

  useEffect(() => {
    if (serviceType === 'worker') {
      setValue('scaling.autoscaling.targets.requests.enabled', false, { shouldValidate: true });
      void trigger('scaling.autoscaling.targets');
    }
  }, [serviceType, setValue, trigger]);
}

function useUpdateScalingWhenInstanceSelected() {
  const { setValue } = useFormContext<ServiceForm>();
  const instanceCategory = useWatchServiceForm('instance.category');
  const instanceIdentifier = useWatchServiceForm('instance.identifier');

  useEffect(() => {
    if (instanceCategory === 'eco') {
      setValue('scaling.type', 'fixed');
    }

    if (instanceIdentifier === 'free') {
      setValue('scaling.fixed', 1);
    }
  }, [instanceCategory, instanceIdentifier, setValue]);
}

const SectionTitle = () => {
  const scaling = useWatchServiceForm('scaling');

  if (scaling.type === 'fixed') {
    return (
      <div className="row gap-1">
        <T id="fixed" />
        <span className="font-normal text-dim">
          <T id="instancePerRegion" values={{ value: scaling.fixed }} />
        </span>
      </div>
    );
  }

  return (
    <div className="row gap-1">
      {scaling.type === 'autoscaling' && <T id="autoscaling" />}
      <span className="font-normal text-dim">
        <T id="instancesPerRegion" values={{ min: scaling.autoscaling.min, max: scaling.autoscaling.max }} />
      </span>
    </div>
  );
};
