import { useFormContext } from 'react-hook-form';

import { CatalogInstance } from 'src/api/model';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { keys } from 'src/utils/object';

import { Scaling, ServiceForm } from '../service-form.types';

type Target = keyof Scaling['targets'];

export function useScalingRules() {
  const { getValues, setValue, resetField } = useFormContext<ServiceForm>();

  const onScalingChanged = (min: number, max: number): void => {
    const { serviceType, scaling } = getValues();

    if (min > 0) {
      setValue('scaling.scaleToZero.lightSleep.enabled', false, { shouldValidate: true });
    }

    if (min !== max && max > 1) {
      const target: Target = serviceType === 'worker' ? 'cpu' : 'requests';
      setValue(`scaling.targets.${target}.enabled`, true, { shouldValidate: true });
    } else {
      for (const target of keys(scaling.targets)) {
        setValue(`scaling.targets.${target}.enabled`, false, { shouldValidate: true });
        resetField(`scaling.targets.${target}.value`);
      }
    }
  };

  const onInstanceChanged = (previous: CatalogInstance | null, selected: CatalogInstance | null) => {
    const { meta, scaling } = getValues();

    const set = ({ min, max }: { min?: number; max?: number }) => {
      if (min !== undefined) setValue('scaling.min', min, { shouldValidate: true });
      if (max !== undefined) setValue('scaling.max', max, { shouldValidate: true });
      onScalingChanged(min ?? scaling.min, max ?? scaling.max);
    };

    if (selected?.id === 'free') {
      set({ min: 0, max: 1 });
    }

    if (selected?.category === 'eco' && selected?.id !== 'free') {
      set({ min: scaling.max });
    }

    if (meta.serviceId === null && previous?.category !== 'gpu' && selected?.category === 'gpu') {
      set({ min: 0 });
    }

    if (!isTenstorrentGpu(previous) && isTenstorrentGpu(selected)) {
      set({ min: 1 });
    }

    if (isTenstorrentGpu(previous) && !isTenstorrentGpu(selected)) {
      set({ min: 0 });
    }

    if (selected?.category === 'gpu') {
      setValue('scaling.scaleToZero.lightSleep.enabled', false);
    }
  };

  return {
    onScalingChanged,
    onInstanceChanged,
  };
}
