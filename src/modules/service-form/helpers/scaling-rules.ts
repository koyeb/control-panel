import { useFormContext } from 'react-hook-form';

import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { CatalogInstance, ServiceType } from 'src/model';
import { keys } from 'src/utils/object';

import { Scaling, ServiceForm } from '../service-form.types';

import { defaultServiceForm } from './initialize-service-form';

type Target = keyof Scaling['targets'];

const { scaling: defaultScaling } = defaultServiceForm();

export function useScalingRules() {
  const { getValues, setValue } = useFormContext<ServiceForm>();

  const enableTarget = (target: Target) => {
    setValue(`scaling.targets.${target}.enabled`, true, { shouldValidate: true });
  };

  const disableTarget = (target: Target) => {
    setValue(`scaling.targets.${target}`, defaultScaling.targets[target], { shouldValidate: true });
  };

  const onScalingChanged = (min: number, max: number): void => {
    const { serviceType, scaling } = getValues();

    if (min > 0) {
      setValue('scaling.scaleToZero', defaultServiceForm().scaling.scaleToZero, { shouldValidate: true });
    }

    if (min !== max && max > 1) {
      enableTarget(serviceType === 'worker' ? 'cpu' : 'requests');
    } else {
      keys(scaling.targets).forEach(disableTarget);
    }
  };

  const onScalingTargetChanged = (target: Target, enabled: boolean) => {
    const defaultValue = defaultScaling.targets[target].value;

    if (!enabled) {
      setValue(`scaling.targets.${target}.value`, defaultValue, { shouldValidate: true });
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

    if (selected?.category === 'eco' && selected.id !== 'free') {
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
      setValue('scaling.scaleToZero.lightSleepEnabled', false);
    }
  };

  const onServiceTypeChanged = (type: ServiceType) => {
    const { min, max } = getValues('scaling');

    if (type === 'worker') {
      if (min === 0) {
        setValue('scaling.min', 1, { shouldValidate: true });
        onScalingChanged(1, max);
      }

      disableTarget('requests');
      disableTarget('concurrentRequests');
      disableTarget('responseTime');
    }
  };

  return {
    onScalingChanged,
    onScalingTargetChanged,
    onInstanceChanged,
    onServiceTypeChanged,
  };
}

export function getDeepSleepValue({
  idlePeriod,
  lightToDeepPeriod,
  lightSleepEnabled,
}: Scaling['scaleToZero']) {
  if (lightSleepEnabled) {
    return idlePeriod + lightToDeepPeriod;
  } else {
    return idlePeriod;
  }
}

export function getLightSleepValue({ idlePeriod, lightSleepEnabled }: Scaling['scaleToZero']) {
  if (lightSleepEnabled) {
    return idlePeriod;
  }
}

export function getScaleToZero(
  deepSleepValue: number,
  lightSleepValue?: number,
): Partial<Scaling['scaleToZero']> {
  if (lightSleepValue !== undefined) {
    return {
      lightSleepEnabled: true,
      idlePeriod: lightSleepValue,
      lightToDeepPeriod: deepSleepValue - lightSleepValue,
    };
  }

  return {
    lightSleepEnabled: false,
    idlePeriod: deepSleepValue,
  };
}
