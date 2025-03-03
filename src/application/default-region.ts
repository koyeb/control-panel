import { QueryClient } from '@tanstack/react-query';

import { CatalogDatacenter, CatalogRegion } from 'src/api/model';
import { inArray } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

import { getUrlLatency } from './url-latency';

export async function getDefaultRegion(
  queryClient: QueryClient,
  datacenters: CatalogDatacenter[],
  regions: CatalogRegion[],
  instance: string | null,
) {
  const availableRegions = regions
    .filter((region) => region.status === 'available')
    .filter((region) => region.scope === 'metropolitan')
    .filter((region) => !region.instances || inArray(instance, region.instances));

  const regionLatencies = await getRegionLatencies(queryClient, datacenters, availableRegions);

  availableRegions.sort(
    (a, b) => (regionLatencies.get(a) ?? Infinity) - (regionLatencies.get(b) ?? Infinity),
  );

  if (availableRegions.length > 0) {
    return availableRegions[0];
  }
}

function getRegionDatacenterUrl(datacenters: CatalogDatacenter[], region: CatalogRegion) {
  const datacenter = datacenters.find(hasProperty('identifier', region.datacenters[0]));

  if (datacenter) {
    return `https://${datacenter.domain}/health`;
  }
}

async function getRegionLatencies(
  queryClient: QueryClient,
  datacenters: CatalogDatacenter[],
  regions: CatalogRegion[],
) {
  const result = new Map<CatalogRegion, number>();

  await Promise.all(
    regions.map(async (region) => {
      const url = getRegionDatacenterUrl(datacenters, region);

      if (url === undefined) {
        return;
      }

      const state = queryClient.getQueryState(['datacenterLatency', url]);

      if (state?.status !== 'success') {
        await queryClient.fetchQuery({
          queryKey: ['datacenterLatency', url],
          queryFn: () => getUrlLatency(url),
        });
      }
    }),
  );

  for (const region of regions) {
    const url = getRegionDatacenterUrl(datacenters, region);
    const latency = queryClient.getQueryData(['datacenterLatency', url]);

    if (typeof latency === 'number') {
      result.set(region, latency);
    }
  }

  return result;
}
