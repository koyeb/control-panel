import { useFormContext } from 'react-hook-form';

import { CatalogInstance } from 'src/api/model';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { keys } from 'src/utils/object';

import { Scaling, ServiceForm } from '../service-form.types';

type Target = keyof Scaling['targets'];

export function useScalingRules() {
  const { getValues, setValue, resetField } = useFormContext<ServiceForm>();

  return {
    onScalingChanged(min: number, max: number) {
      const { serviceType, scaling } = getValues();

      if (min > 0) {
        setValue('scaling.scaleToZero.lightSleep.enabled', false, { shouldValidate: true });
      }

      if (max > 1) {
        const target: Target = serviceType === 'worker' ? 'cpu' : 'requests';
        setValue(`scaling.targets.${target}.enabled`, true, { shouldValidate: true });
      }

      if (min === max || max === 1) {
        for (const target of keys(scaling.targets)) {
          setValue(`scaling.targets.${target}.enabled`, false, { shouldValidate: true });
          resetField(`scaling.targets.${target}.value`);
        }
      }
    },

    onInstanceChanged(previous: CatalogInstance | null, selected: CatalogInstance | null) {
      const { meta, scaling } = getValues();

      if (selected?.id === 'free') {
        setValue('scaling.min', 0, { shouldValidate: true });
        setValue('scaling.max', 1, { shouldValidate: true });
        this.onScalingChanged(0, 1);
      }

      if (selected?.category === 'eco' && selected?.id !== 'free') {
        setValue('scaling.min', scaling.max, { shouldValidate: true });
        this.onScalingChanged(scaling.max, scaling.max);
      }

      if (selected?.category === 'gpu') {
        setValue('scaling.scaleToZero.lightSleep.enabled', false);
      }

      if (meta.serviceId === null && previous?.category !== 'gpu' && selected?.category === 'gpu') {
        setValue('scaling.min', 0, { shouldValidate: true });
        this.onScalingChanged(0, scaling.max);
      }

      if (!isTenstorrentGpu(previous) && isTenstorrentGpu(selected)) {
        setValue('scaling.min', 1, { shouldValidate: true });
        this.onScalingChanged(1, scaling.max);
      }

      if (isTenstorrentGpu(previous) && !isTenstorrentGpu(selected)) {
        setValue('scaling.min', 0, { shouldValidate: true });
        this.onScalingChanged(0, scaling.max);
      }
    },
  };
}
