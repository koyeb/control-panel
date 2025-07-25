import { Badge } from '@koyeb/design-system';
import { useFormContext } from 'react-hook-form';

import { useInstance } from 'src/api/hooks/catalog';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { AutoscalingConfiguration } from './autoscaling';
import { ScaleToZeroConfiguration } from './scale-to-zero';
import { ScalingValues } from './scaling-values';

const T = createTranslate('modules.serviceForm.scaling');

export function ScalingConfiguration() {
  const { watch } = useFormContext<ServiceForm>();
  const instance = useInstance(watch('instance'));

  const isFreeInstance = instance?.id === 'free';
  const isEcoInstance = instance?.category === 'eco';
  const hasVolumes = watch('volumes').map((volume) => volume.name !== '').length > 0;
  const min = watch('scaling.min');
  const max = watch('scaling.max');

  return (
    <>
      {isFreeInstance && <FreeInstanceInfo />}

      <ScalingValues
        type={isEcoInstance && !isFreeInstance ? 'fixed' : 'autoscaling'}
        disabled={isFreeInstance || hasVolumes}
      />

      <ScaleToZeroConfiguration
        disabled={isFreeInstance || min > 0}
        isEcoInstance={isEcoInstance}
        hasVolumes={hasVolumes}
      />

      <AutoscalingConfiguration disabled={min === max || max === 1} hasVolumes={hasVolumes} />
    </>
  );
}

function FreeInstanceInfo() {
  return (
    <Badge color="blue" className="text-start">
      <T id="freeInstanceInfo" />
    </Badge>
  );
}
