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

  loader: async ({ context: { queryClient }, params, deps }) => {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    if (deps.deploymentId === undefined) {
      const service = await ensureApiQueryData('get /v1/services/{id}', {
        path: { id: params.serviceId },
      }).then((result) => mapService(result.service!));

      throw redirect({
        to: '/services/$serviceId',
        params,
        search: (prev) => ({
          ...prev,
          deploymentId: service.activeDeploymentId ?? service.latestDeploymentId,
        }),
      });
    }

    await Promise.all([
      ensureApiQueryData('get /v1/volumes', {
        query: { limit: String(100) },
      }),

      ensureApiQueryData('get /v1/streams/metrics', {
        query: { service_id: params.serviceId, name: 'CPU_TOTAL_PERCENT' },
      }),

      ensureApiQueryData('get /v1/streams/metrics', {
        query: { service_id: params.serviceId, name: 'MEM_RSS' },
      }),

      ensureApiQueryData('get /v1/deployments/{id}', {
        path: { id: deps.deploymentId },
      }),

      ensureApiQueryData('get /v1/deployment/{id}/scaling', {
        path: { id: deps.deploymentId },
        query: {},
      }),

      ensureApiQueryData('get /v1/instances', {
        query: { deployment_id: deps.deploymentId, limit: String(100), order: 'desc' },
      }),

      queryClient.ensureInfiniteQueryData({
        queryKey: getApiQueryKey('get /v1/deployments', {
          query: {
            service_id: params.serviceId,
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
