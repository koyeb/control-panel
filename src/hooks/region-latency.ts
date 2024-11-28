import { useQuery } from '@tanstack/react-query';

import { useBreakpoint } from '@koyeb/design-system';
import { mapCatalogDatacentersList } from 'src/api/mappers/catalog';
import { CatalogRegion } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { getConfig } from 'src/application/config';

const { disablePolling } = getConfig();

export function useRegionLatency(region: CatalogRegion | undefined) {
  const datacenter = useRegionDatacenter(region);
  const url = datacenter ? `https://${datacenter?.domain}/health` : undefined;

  const isDesktop = useBreakpoint('lg');

  // avoid "Cannot access uninitialized variable" error on iOS
  const enabled = url !== undefined && isDesktop;

  const { data } = useQuery({
    queryKey: ['datacenterLatency', url],
    retry: false,
    enabled,
    refetchInterval: disablePolling ? false : 10 * 1000,
    queryFn() {
      return new Promise<number | null>((resolve) => {
        const unsubscribe = observeResources((entries) => {
          const entry = entries.find((entry) => entry.url === url);

          if (entry) {
            unsubscribe();
            resolve(entry.latency);
          }
        });

        fetch(url as string, { mode: 'no-cors' }).catch(() => {
          unsubscribe();
          resolve(null);
        });
      });
    },
  });

  if (!enabled) {
    return null;
  }

  return data;
}

function useDatacenters() {
  const { data: datacenters = [] } = useQuery({
    ...useApiQueryFn('listCatalogDatacenters'),
    refetchInterval: false,
    select: mapCatalogDatacentersList,
  });

  return datacenters;
}

function useRegionDatacenter(region: CatalogRegion | undefined) {
  return useDatacenters().find((datacenter) => datacenter.identifier === region?.datacenters[0]);
}

type ResourceTiming = {
  url: string;
  latency: number;
};

function observeResources(cb: (entry: Array<ResourceTiming>) => void): () => void {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries().filter(isPerformanceResourceTiming).map(transformResourceTiming);

    cb(entries);
  });

  observer.observe({ type: 'resource', buffered: true });

  return () => observer.disconnect();
}

function isPerformanceResourceTiming(
  this: void,
  entry: PerformanceEntry,
): entry is PerformanceResourceTiming {
  return entry instanceof PerformanceResourceTiming;
}

function transformResourceTiming(this: void, entry: PerformanceResourceTiming): ResourceTiming {
  let latency = entry.responseStart - entry.requestStart;

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin
  if (latency === 0) {
    latency = entry.duration;
  }

  return {
    url: entry.name,
    latency,
  };
}
