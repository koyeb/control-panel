import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDatacenters } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import { getConfig } from 'src/application/config';
import { getUrlLatency } from 'src/application/url-latency';

const { disablePolling } = getConfig();

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

export function useDatacenterLatencies() {
  const datacenters = useDatacenters().filter(({ id }) => !id.includes('aws'));

  return useQueries({
    queries: datacenters.map((datacenter) => ({
      queryKey: ['datacenterLatency', datacenter.domain],
      queryFn: () => getUrlLatency(`https://${datacenter.domain}/health`),
      select: (latency: number | null) => [datacenter.id, latency] as const,
      refetchInterval: disablePolling ? (false as const) : 10_000,
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
