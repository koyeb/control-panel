import { useMemo } from 'react';

import { useInstance } from 'src/api/hooks/catalog';
import { CatalogInstance } from 'src/api/model';

import { Scaling, ServiceForm } from '../service-form.types';

export function useEstimatedCost(
  values: Partial<Pick<ServiceForm, 'instance' | 'regions' | 'scaling'>>,
): ServiceCost | undefined {
  const { scaling, regions } = values;
  const instance = useInstance(values.instance?.identifier ?? null);

  return useMemo(() => {
    return computeEstimatedCost(instance, regions, scaling);
  }, [instance, regions, scaling]);
}

export function computeEstimatedCost(
  instance?: CatalogInstance,
  regions?: string[],
  scaling?: Scaling,
): ServiceCost | undefined {
  if (!instance || !scaling || !regions) {
    return;
  }

  if (scaling.type === 'fixed') {
    return calculateCost(scaling.fixed, regions.length, instance);
  } else {
    return [
      calculateCost(scaling.autoscaling.min, regions.length, instance),
      calculateCost(scaling.autoscaling.max, regions.length, instance),
    ];
  }
}

type FixedCost = ReturnType<typeof calculateCost>;
type VariableCost = [min: FixedCost, max: FixedCost];

export type ServiceCost = FixedCost | VariableCost;

function calculateCost(instanceCount: number, regionCount: number, instance: CatalogInstance) {
  const instancesPrice = {
    perHour: instanceCount * instance.pricePerSecond * 60 * 60,
    perMonth: instanceCount * instance.pricePerMonth,
  };

  const totalPrice = {
    perHour: instancesPrice.perHour * regionCount,
    perMonth: instancesPrice.perMonth * regionCount,
  };

  return {
    instanceCount,
    instance,
    regionCount,
    instancesPrice,
    totalPrice,
  };
}
