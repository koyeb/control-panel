import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { createEnsureApiQueryData, getApi, getApiQueryKey, mapDeployment, mapService } from 'src/api';
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

  loader: async ({ context: { queryClient }, params: { serviceId }, deps: { deploymentId } }) => {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);
    const [service_id, deployment_id] = [serviceId, deploymentId];

    if (deploymentId === undefined) {
      const service = await ensureApiQueryData('get /v1/services/{id}', { path: { id: serviceId } }).then(
        (result) => mapService(result.service!),
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
      ensureApiQueryData('get /v1/volumes', { query: { limit: String(100) } }),
      ensureApiQueryData('get /v1/streams/metrics', { query: { service_id, name: 'CPU_TOTAL_PERCENT' } }),
      ensureApiQueryData('get /v1/streams/metrics', { query: { service_id, name: 'MEM_RSS' } }),
      ensureApiQueryData('get /v1/deployments/{id}', { path: { id: deploymentId } }),
      ensureApiQueryData('get /v1/deployment/{id}/scaling', { path: { id: deploymentId }, query: {} }),
      ensureApiQueryData('get /v1/instances', {
        query: { deployment_id, limit: String(100), order: 'desc' },
      }),

      queryClient.ensureInfiniteQueryData({
        queryKey: getApiQueryKey('get /v1/deployments', {
          query: {
            service_id,
            statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
          },
        }),
        queryFn: async ({ queryKey, pageParam }) => {
          const api = getApi();

          const { count, deployments } = await api('get /v1/deployments', {
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
