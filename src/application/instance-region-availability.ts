import { useCallback, useMemo } from 'react';

import { useInstances, useRegion, useRegions } from 'src/api/hooks/catalog';
import { useOrganizationSummary } from 'src/api/hooks/session';
import { CatalogInstance, CatalogRegion, OrganizationSummary, ServiceType } from 'src/api/model';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { inArray } from 'src/utils/arrays';
import { toObject } from 'src/utils/object';

export type RegionAvailability = [available: true] | [available: false, reason: RegionUnavailableReason];

export type RegionUnavailableReason = 'unavailable' | 'regionNotFound' | 'unavailableForInstance';

export function useRegionAvailabilities(options?: CheckRegionAvailabilityOptions) {
  const regions = useRegions();
  const optionsMemo = useDeepCompareMemo(options);

  return useMemo(() => {
    return toObject(
      regions,
      (region) => region.identifier,
      (region) => checkRegionAvailability(region, optionsMemo),
    );
  }, [regions, optionsMemo]);
}

export function useIsRegionAvailable(options?: CheckRegionAvailabilityOptions) {
  const availabilities = useRegionAvailabilities(options);

  return useCallback(
    ({ identifier }: CatalogRegion) => Boolean(availabilities[identifier]?.[0]),
    [availabilities],
  );
}

export function useRegionAvailability(regionIdentifier: string) {
  return useRegionAvailabilities()[regionIdentifier] ?? [false, 'regionNotFound'];
}

export type CheckRegionAvailabilityOptions = {
  instance?: CatalogInstance;
};

function checkRegionAvailability(
  region: CatalogRegion,
  options: CheckRegionAvailabilityOptions = {},
): RegionAvailability {
  if (region.status !== 'available') {
    return [false, 'unavailable'];
  }

  if (options.instance && region.instances && !region.instances.includes(options.instance.identifier)) {
    return [false, 'unavailableForInstance'];
  }

  return [true];
}

export function useRegionAvailabilityForInstance(
  regionIdentifier: string,
  instanceIdentifier?: string | null,
) {
  const region = useRegion(regionIdentifier);

  if (instanceIdentifier === undefined || region?.instances === undefined) {
    return true;
  }

  return inArray(instanceIdentifier, region.instances);
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

export function useInstanceAvailabilities(options: CheckInstanceAvailabilityOptions = {}) {
  const instances = useInstances();
  const check = useCheckInstanceAvailability(options);

  return useMemo(() => {
    return toObject(instances, (instance) => instance.identifier, check);
  }, [instances, check]);
}

export function useIsInstanceAvailable(options: CheckInstanceAvailabilityOptions = {}) {
  const availabilities = useInstanceAvailabilities(options);

  return useCallback(
    ({ identifier }: CatalogInstance) => Boolean(availabilities[identifier]?.[0]),
    [availabilities],
  );
}

export function useCheckInstanceAvailability(options: CheckInstanceAvailabilityOptions = {}) {
  const organizationSummary = useOrganizationSummary();
  const optionsMemo = useDeepCompareMemo(options);

  return useCallback(
    (instance: CatalogInstance) => {
      return checkInstanceAvailability(instance, organizationSummary, optionsMemo);
    },
    [organizationSummary, optionsMemo],
  );
}

export type CheckInstanceAvailabilityOptions = {
  serviceType?: ServiceType;
  hasVolumes?: boolean;
  previousInstance?: CatalogInstance;
};

function checkInstanceAvailability(
  instance: CatalogInstance,
  summary: OrganizationSummary | undefined,
  options: CheckInstanceAvailabilityOptions = {},
): InstanceAvailability {
  const { serviceType, hasVolumes, previousInstance } = options;

  if (hasVolumes && previousInstance) {
    if (previousInstance.category !== 'gpu' && instance.category === 'gpu') {
      return [false, 'changeCpuToGpuWithVolume'];
    }

    if (previousInstance.category === 'gpu' && previousInstance.identifier !== instance.identifier) {
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

  if (instance.identifier === 'free') {
    if (summary?.freeInstanceUsed && (!previousInstance || previousInstance.identifier !== 'free')) {
      return [false, 'freeAlreadyUsed'];
    }

    if (serviceType === 'worker') {
      return [false, 'freeWorker'];
    }
  }

  return [true];
}
