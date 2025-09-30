import { useQueries } from '@tanstack/react-query';

import { API, apiQuery, useCatalogInstance } from 'src/api';
import { parseBytes } from 'src/application/memory';
import { CatalogInstance, ComputeDeployment } from 'src/model';
import { last, unique } from 'src/utils/arrays';
import { identity, isDefined } from 'src/utils/generic';
import { clamp } from 'src/utils/math';
import { toObject } from 'src/utils/object';

export function useReplicaMetricsQuery(deployment: ComputeDeployment) {
  const instance = useCatalogInstance(deployment.definition.instanceType);

  return useQueries({
    queries: [
      apiQuery('get /v1/streams/metrics', {
        query: { service_id: deployment.serviceId, name: 'CPU_TOTAL_PERCENT' },
      }),
      apiQuery('get /v1/streams/metrics', {
        query: { service_id: deployment.serviceId, name: 'MEM_RSS' },
      }),
    ],
    combine([cpu, memory]) {
      const instanceIds = unique([
        ...(cpu.data?.metrics?.map(({ labels }) => labels?.instance_id) ?? []),
        ...(memory.data?.metrics?.map(({ labels }) => labels?.instance_id) ?? []),
      ]).filter(isDefined);

      return {
        isPending: cpu.isPending || memory.isPending,
        data: toObject(instanceIds, identity, (instanceId) =>
          getMetrics(instance, instanceId, cpu.data?.metrics, memory.data?.metrics),
        ),
      };
    },
  });
}

function getMetrics(
  instance: CatalogInstance | undefined,
  instanceId: string,
  cpu: API.GetMetricsReplyMetric[] | undefined,
  memory: API.GetMetricsReplyMetric[] | undefined,
) {
  const getSamples = (metric?: API.GetMetricsReplyMetric[]): number[] => {
    return (
      metric
        ?.find((metric) => metric.labels!.instance_id === instanceId)
        ?.samples?.map((sample) => sample.value)
        .filter(isDefined) ?? []
    );
  };

  const getCpuPercent = (): number | undefined => {
    const vCpu = instance?.vcpuShares ?? 1;
    const lastDataPoint = last(getSamples(cpu));

    if (lastDataPoint !== undefined) {
      return clamp(lastDataPoint / (100 * vCpu), { min: 0, max: 1 });
    }
  };

  const getMemoryPercent = (): number | undefined => {
    const lastDataPoint = last(getSamples(memory));
    const maxMemory = parseBytes(instance?.memory);

    if (lastDataPoint !== undefined && !Number.isNaN(maxMemory)) {
      return clamp(lastDataPoint / maxMemory, { min: 0, max: 1 });
    }
  };

  return {
    cpu: getCpuPercent(),
    memory: getMemoryPercent(),
  };
}
