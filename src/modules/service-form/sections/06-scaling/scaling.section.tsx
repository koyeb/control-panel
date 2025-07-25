import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { useWatchServiceForm } from '../../use-service-form';

import { ScalingConfiguration } from './scaling-configuration';

const T = createTranslate('modules.serviceForm.scaling');

export function ScalingSection() {
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
