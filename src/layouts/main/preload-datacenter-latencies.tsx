import { useQueries } from '@tanstack/react-query';

import { useDatacenters } from 'src/api/hooks/catalog';
import { getUrlLatency } from 'src/application/url-latency';

export function PreloadDatacenterLatencies() {
  const datacenters = useDatacenters();
  const urls = datacenters.map((datacenter) => `https://${datacenter.domain}/health`);

  useQueries({
    queries: urls.map((url) => ({
      refetchInterval: false as const,
      queryKey: ['datacenterLatency', url],
      queryFn: () => getUrlLatency(url),
    })),
  });

  return null;
}
