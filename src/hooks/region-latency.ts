import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDatacentersCatalog } from 'src/api';
import { getUrlLatency } from 'src/application/url-latency';
import { CatalogRegion } from 'src/model';

export function useRegionLatency(region: CatalogRegion | undefined): undefined | null | number {
  const latenciesQuery = useDatacenterLatencies();

  return useMemo(() => {
    if (latenciesQuery.pending) {
      return undefined;
    }

    const latencies = region?.datacenters
      .map((id) => latenciesQuery.latencies.get(id))
      .filter((value): value is number => typeof value === 'number');

    latencies?.sort();

    return latencies?.at(0);
  }, [region, latenciesQuery]);
}

function useDatacenterLatencies() {
  const datacenters = useDatacentersCatalog().filter(({ id }) => !id.includes('aws'));

  return useQueries({
    queries: datacenters.map((datacenter) => ({
      queryKey: ['datacenterLatency', datacenter.domain],
      queryFn: () => getUrlLatency(`https://${datacenter.domain}/health`),
      select: (latency: number | null) => [datacenter.id, latency] as const,
      refetchInterval: 10_000,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
    combine(results) {
      return {
        pending: results.some((result) => result.isPending),
        latencies: new Map(results.map((result) => (result.isSuccess ? result.data : ['', null]))),
      };
    },
  });
}
