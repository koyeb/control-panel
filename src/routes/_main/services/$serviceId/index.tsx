import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { createEnsureApiQueryData, getApi, getApiQueryKey, mapService } from 'src/api';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { ServiceOverviewPage } from 'src/pages/service/overview/service-overview.page';
import { exclude } from 'src/utils/arrays';

export const Route = createFileRoute('/_main/services/$serviceId/')({
  component: function Component() {
    const { serviceId } = Route.useParams();
    const { deploymentId } = Route.useSearch();

    return <ServiceOverviewPage serviceId={serviceId} deploymentId={deploymentId} />;
  },

  validateSearch: z.object({
    deploymentId: z.string().optional(),
  }),

  loaderDeps: ({ search }) => ({
    deploymentId: search.deploymentId,
  }),

  loader: async ({ context: { authKit, queryClient }, params, deps }) => {
    const api = getApi(authKit.getAccessToken);
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
            statuses: exclude(allApiDeploymentStatuses, 'STASHED'),
          },
        }),
        queryFn: async ({ queryKey, pageParam }) => {
          return api('get /v1/deployments', {
            query: {
              ...queryKey[1].query,
              limit: String(10),
              offset: String(10 * pageParam),
            },
          });
        },
        initialPageParam: 0,
      }),
    ]);
  },
});
