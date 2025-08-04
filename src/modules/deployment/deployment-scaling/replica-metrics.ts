import { useQueries } from '@tanstack/react-query';

import { API } from 'src/api/api';
import { useInstance } from 'src/api/hooks/catalog';
import { CatalogInstance, ComputeDeployment } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { parseBytes } from 'src/application/memory';
import { last, unique } from 'src/utils/arrays';
import { identity, isDefined } from 'src/utils/generic';
import { clamp } from 'src/utils/math';
import { toObject } from 'src/utils/object';

export function useReplicaMetricsQuery(deployment: ComputeDeployment) {
  const instance = useInstance(deployment.definition.instanceType);

  return useQueries({
    queries: [
      useApiQueryFn('getServiceMetrics', {
        query: { service_id: deployment.serviceId, name: 'CPU_TOTAL_PERCENT' },
      }),
      useApiQueryFn('getServiceMetrics', {
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
      return clamp(0, lastDataPoint / (100 * vCpu), 1);
    }
  };

  const getMemoryPercent = (): number | undefined => {
    const lastDataPoint = last(getSamples(memory));
    const maxMemory = parseBytes(instance?.memory);

    if (lastDataPoint !== undefined && !Number.isNaN(maxMemory)) {
      return clamp(0, lastDataPoint / maxMemory, 1);
    }
  };

  return {
    cpu: getCpuPercent(),
    memory: getMemoryPercent(),
  };
}
