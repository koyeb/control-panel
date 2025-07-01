import { useQueries } from '@tanstack/react-query';
import { Duration, sub } from 'date-fns';

import { ApiEndpointResult, api } from 'src/api/api';
import type { Api } from 'src/api/api-types';
import { useAuth } from 'src/application/authentication';
import { identity } from 'src/utils/generic';
import { toObject } from 'src/utils/object';

import { MetricsTimeFrame } from './metrics-helpers';
import { DataPoint, Metric } from './metrics-types';

const timeFrameToDuration: Record<MetricsTimeFrame, Duration> = {
  '5m': { minutes: 5 },
  '15m': { minutes: 15 },
  '1h': { hours: 1 },
  '6h': { hours: 6 },
  '1d': { days: 1 },
  '2d': { days: 2 },
  '7d': { days: 7 },
};

const timeFrameToStep: Record<MetricsTimeFrame, string> = {
  '5m': '1m',
  '15m': '1m',
  '1h': '1m',
  '6h': '5m',
  '1d': '30m',
  '2d': '1h',
  '7d': '3h',
};

type UseMetricsOptions = {
  serviceId?: string;
  instanceId?: string;
  metrics: Api.MetricName[];
  timeFrame: MetricsTimeFrame;
};

export function useMetricsQueries({ serviceId, instanceId, metrics, timeFrame }: UseMetricsOptions) {
  const { token } = useAuth();

  return useQueries({
    queries: metrics.map((name) => ({
      queryKey: ['getServiceMetrics', { token, serviceId, instanceId, name, timeFrame }],
      refetchInterval: 60 * 1000,
      meta: { showError: false },
      async queryFn() {
        const step = timeFrameToStep[timeFrame];
        const duration = timeFrameToDuration[timeFrame];
        const start = sub(new Date(), duration).toISOString();

        return api.getServiceMetrics({
          token,
          query: { name, start, step, service_id: serviceId, instance_id: instanceId },
        });
      },
      select(data: ApiEndpointResult<'getServiceMetrics'>) {
        return data.metrics!.map(({ labels, samples }) => ({
          labels,
          samples: samples!.map(
            ({ timestamp, value }): DataPoint => ({
              date: timestamp!,
              value: value ?? undefined,
            }),
          ),
        }));
      },
    })),
    combine: (queries) => ({
      isPending: queries.some((query) => query.isPending),
      isError: queries.some((query) => query.isError),
      error: toObject(metrics, identity, (_, index) => queries[index]?.error),
      data: toObject(metrics, identity, (_, index): Metric[] | undefined => queries[index]?.data),
    }),
  });
}
