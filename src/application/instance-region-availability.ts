import { useMemo } from 'react';

import { useInstances, useRegion, useRegions } from 'src/api/hooks/catalog';
import { useOrganizationSummary } from 'src/api/hooks/session';
import { CatalogInstance, CatalogRegion, OrganizationSummary, ServiceType } from 'src/api/model';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { inArray } from 'src/utils/arrays';
import { defined } from 'src/utils/assert';
import { toObject } from 'src/utils/object';

export type RegionAvailability = [available: true] | [available: false, reason: RegionUnavailableReason];

export type RegionUnavailableReason = 'unavailable' | 'regionNotFound' | 'unavailableForInstance';

export function useRegionAvailabilities() {
  const regions = useRegions();

  return useMemo(() => {
    return toObject(
      regions,
      (region) => region.identifier,
      (region) => checkRegionAvailability(region),
    );
  }, [regions]);
}

export function useRegionAvailability(regionIdentifier: string) {
  return useRegionAvailabilities()[regionIdentifier] ?? [false, 'regionNotFound'];
}

function checkRegionAvailability(region: CatalogRegion): RegionAvailability {
  if (region.status !== 'available') {
    return [false, 'unavailable'];
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
  const organizationSummary = defined(useOrganizationSummary());
  const optionsMemo = useDeepCompareMemo(options);

  return useMemo(() => {
    return toObject(
      instances,
      (instance) => instance.identifier,
      (instance) => checkInstanceAvailability(instance, organizationSummary, optionsMemo),
    );
  }, [instances, organizationSummary, optionsMemo]);
}

type CheckInstanceAvailabilityOptions = {
  serviceType?: ServiceType;
  hasVolumes?: boolean;
  allowFreeInstanceIfAlreadyUsed?: boolean;
  previousInstance?: CatalogInstance;
};

function checkInstanceAvailability(
  instance: CatalogInstance,
  summary: OrganizationSummary | undefined,
  options: CheckInstanceAvailabilityOptions = {},
): InstanceAvailability {
  const { serviceType, hasVolumes, allowFreeInstanceIfAlreadyUsed, previousInstance } = options;

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
    if (summary?.freeInstanceUsed && !allowFreeInstanceIfAlreadyUsed) {
      return [false, 'freeAlreadyUsed'];
    }

    if (serviceType === 'worker') {
      return [false, 'freeWorker'];
    }
  }

  return [true];
}
