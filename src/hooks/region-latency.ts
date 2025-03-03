import { useQuery } from '@tanstack/react-query';

import { useDatacenters } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import { getConfig } from 'src/application/config';
import { getUrlLatency } from 'src/application/url-latency';

const { disablePolling } = getConfig();

export function useRegionLatency(region: CatalogRegion | undefined) {
  const datacenter = useRegionDatacenter(region);
  const url = datacenter ? `https://${datacenter?.domain}/health` : undefined;
  const enabled = url !== undefined;

  const { data } = useQuery({
    queryKey: ['datacenterLatency', url],
    enabled,
    retry: false,
    refetchOnMount: false,
    refetchInterval: disablePolling ? false : 10 * 1000,
    queryFn: () => getUrlLatency(url as string),
  });

  if (!enabled) {
    return null;
  }

  return data;
}

function useRegionDatacenter(region: CatalogRegion | undefined) {
  return useDatacenters().find((datacenter) => datacenter.identifier === region?.datacenters[0]);
}
