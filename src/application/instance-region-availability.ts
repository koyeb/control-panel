import { useMemo } from 'react';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useOrganizationSummary } from 'src/api/hooks/session';
import { CatalogInstance, CatalogRegion, OrganizationSummary, ServiceType } from 'src/api/model';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { toObject } from 'src/utils/object';

export type RegionAvailability = [available: true] | [available: false, reason: RegionUnavailableReason];

export type RegionUnavailableReason = 'unavailable' | 'regionNotFound' | 'unavailableForInstance';

type RegionAvailabilityOptions = {
  instance?: CatalogInstance | null;
};

export function useRegionAvailabilities(options?: RegionAvailabilityOptions) {
  const regions = useRegions();
  const optionsMemo = useDeepCompareMemo(options);

  return useMemo(() => {
    return toObject(
      regions,
      (region) => region.id,
      (region) => checkRegionAvailability(region, optionsMemo),
    );
  }, [regions, optionsMemo]);
}

export function useRegionAvailability(regionId: string, options?: RegionAvailabilityOptions) {
  return useRegionAvailabilities(options)[regionId] ?? [false, 'regionNotFound'];
}

function checkRegionAvailability(
  region: CatalogRegion,
  options: RegionAvailabilityOptions = {},
): RegionAvailability {
  if (region.status !== 'available') {
    return [false, 'unavailable'];
  }

  if (options.instance && region.instances && !region.instances.includes(options.instance.id)) {
    return [false, 'unavailableForInstance'];
  }

  return [true];
}

export type InstanceAvailability = [available: true] | [available: false, reason: InstanceUnavailableReason];

export type InstanceUnavailableReason =
  | 'instanceNotFound'
  | 'unavailableInCatalog'
  | 'volumesNotEnabled'
  | 'changeCpuToGpuWithVolume'
  | 'changeGpuWithVolume'
  | 'freeWorker'
  | 'freeAlreadyUsed';

type InstanceAvailabilityOptions = {
  serviceType?: ServiceType;
  hasVolumes?: boolean;
  previousInstance?: CatalogInstance;
};

export function useInstanceAvailabilities(options: InstanceAvailabilityOptions = {}) {
  const instances = useInstances();
  const organizationSummary = useOrganizationSummary();
  const optionsMemo = useDeepCompareMemo(options);

  return useMemo(() => {
    return toObject(
      instances,
      (instance) => instance.id,
      (instance) => checkInstanceAvailability(instance, organizationSummary, optionsMemo),
    );
  }, [instances, organizationSummary, optionsMemo]);
}

function checkInstanceAvailability(
  instance: CatalogInstance,
  summary: OrganizationSummary | undefined,
  options: InstanceAvailabilityOptions = {},
): InstanceAvailability {
  const { serviceType, hasVolumes, previousInstance } = options;

  if (hasVolumes && previousInstance) {
    if (previousInstance.category !== 'gpu' && instance.category === 'gpu') {
      return [false, 'changeCpuToGpuWithVolume'];
    }

    if (previousInstance.category === 'gpu' && previousInstance.id !== instance.id) {
      return [false, 'changeGpuWithVolume'];
    }
  }

  if (instance.status !== 'available') {
    if (instance.category === 'gpu') {
      return [true];
    }

    return [false, 'unavailableInCatalog'];
  }

  if (hasVolumes && !instance.hasVolumes) {
    return [false, 'volumesNotEnabled'];
  }

  if (instance.id === 'free') {
    if (summary?.freeInstanceUsed && (!previousInstance || previousInstance.id !== 'free')) {
      return [false, 'freeAlreadyUsed'];
    }

    if (serviceType === 'worker') {
      return [false, 'freeWorker'];
    }
  }

  return [true];
}
