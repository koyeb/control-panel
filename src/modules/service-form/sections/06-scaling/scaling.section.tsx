import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

import { useTrackEvent } from 'src/application/posthog';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { ScalingConfiguration } from './scaling-configuration';

const T = createTranslate('modules.serviceForm.scaling');

export function ScalingSection() {
  useScalingChangedEvent();

  return (
    <ServiceFormSection
      section="scaling"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
      className="col gap-6"
    >
      <ScalingConfiguration />
    </ServiceFormSection>
  );
}

function useScalingChangedEvent() {
  const { watch } = useFormContext<ServiceForm>();
  const track = useTrackEvent();

  const changed = useRef(false);

  useEffect(() => {
    const { unsubscribe } = watch((values, { name }) => {
      if (changed.current || !name?.startsWith('scaling')) {
        return;
      }

      changed.current = true;
      track('scaling_changed');
    });

    return () => unsubscribe();
  }, [watch, track]);
}

function Summary() {
  const scaling = useWatchServiceForm('scaling');
  const fixedScaling = scaling.min === scaling.max;

  return (
    <div className="row gap-1 font-normal text-dim">
      {fixedScaling ? (
        <T id="summaryFixedScaling" values={{ value: scaling.min }} />
      ) : (
        <T id="summaryAutoScaling" values={{ min: scaling.min, max: scaling.max }} />
      )}
    </div>
  );
}
