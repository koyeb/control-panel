import { QueryClient } from '@tanstack/react-query';

import { CatalogDatacenter, CatalogInstance, CatalogRegion } from 'src/api/model';
import { inArray } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

export function getDefaultRegion(
  queryClient: QueryClient,
  datacenters: readonly CatalogDatacenter[],
  regions: readonly CatalogRegion[],
  instance: CatalogInstance | undefined,
) {
  const availableRegions = regions
    .filter((region) => region.status === 'available')
    .filter((region) => !region.instances || inArray(instance?.id, region.instances));

  const regionLatencies = getRegionLatencies(queryClient, datacenters, availableRegions);

  availableRegions.sort(
    (a, b) => (regionLatencies.get(a) ?? Infinity) - (regionLatencies.get(b) ?? Infinity),
  );

  if (availableRegions.length > 0) {
    return availableRegions[0];
  }
}

function getRegionDatacenterUrl(datacenters: readonly CatalogDatacenter[], region: CatalogRegion) {
  const datacenter = datacenters.find(hasProperty('id', region.datacenters[0]));

  if (datacenter) {
    return `https://${datacenter.domain}/health`;
  }
}

function getRegionLatencies(
  queryClient: QueryClient,
  datacenters: readonly CatalogDatacenter[],
  regions: readonly CatalogRegion[],
) {
  const result = new Map<CatalogRegion, number>();

  for (const region of regions) {
    const url = getRegionDatacenterUrl(datacenters, region);
    const latency = queryClient.getQueryData(['datacenterLatency', url]);

    if (typeof latency === 'number') {
      result.set(region, latency);
    }
  }

  return result;
}
