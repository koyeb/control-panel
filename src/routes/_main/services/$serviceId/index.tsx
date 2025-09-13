import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { mapDeployment } from 'src/api/mappers/deployment';
import { mapService } from 'src/api/mappers/service';
import { createEnsureApiQueryData, getApiQueryKey } from 'src/api/use-api';
import { getApi } from 'src/application/container';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { ServiceOverviewPage } from 'src/pages/service/overview/service-overview.page';

export const Route = createFileRoute('/_main/services/$serviceId/')({
  component: ServiceOverviewPage,

  validateSearch: z.object({
    deploymentId: z.string().optional(),
  }),

  loaderDeps: ({ search }) => ({
    deploymentId: search.deploymentId,
  }),

  loader: async ({
    context: { queryClient },
    params: { serviceId },
    deps: { deploymentId },
    abortController,
  }) => {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient, abortController);
    const [service_id, deployment_id] = [serviceId, deploymentId];

    if (deploymentId === undefined) {
      const service = await ensureApiQueryData('getService', { path: { id: serviceId } }).then((result) =>
        mapService(result.service!),
      );

      throw redirect({
        to: '/services/$serviceId',
        params: { serviceId },
        search: (prev) => ({
          ...prev,
          deploymentId: service.activeDeploymentId ?? service.latestDeploymentId,
        }),
      });
    }

    await Promise.all([
      ensureApiQueryData('listVolumes', { query: { limit: String(100) } }),
      ensureApiQueryData('getServiceMetrics', { query: { service_id, name: 'CPU_TOTAL_PERCENT' } }),
      ensureApiQueryData('getServiceMetrics', { query: { service_id, name: 'MEM_RSS' } }),
      ensureApiQueryData('getDeployment', { path: { id: deploymentId } }),
      ensureApiQueryData('getDeploymentScaling', { path: { id: deploymentId }, query: {} }),
      ensureApiQueryData('listInstances', { query: { deployment_id, limit: String(100), order: 'desc' } }),

      queryClient.ensureInfiniteQueryData({
        queryKey: getApiQueryKey('listDeployments', {
          query: {
            service_id,
            statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
          },
        }),
        queryFn: async ({ queryKey, pageParam }) => {
          const { count, deployments } = await getApi().listDeployments({
            query: {
              ...queryKey[1].query,
              limit: String(10),
              offset: String(10 * pageParam),
            },
          });

          return {
            count: count!,
            deployments: deployments!.map(mapDeployment),
          };
        },
        initialPageParam: 0,
      }),
    ]);
  },
});
