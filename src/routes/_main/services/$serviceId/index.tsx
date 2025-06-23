import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { mapService } from 'src/api/mappers/service';
import { apiQueryFn } from 'src/api/use-api';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { ServiceOverviewPage } from 'src/pages/service/overview/service-overview.page';

export const Route = createFileRoute('/_main/services/$serviceId/')({
  component: ServiceOverviewPage,

  validateSearch: z.object({
    deploymentId: z.string().optional(),
  }),

  loader: async ({ context, params }) => {
    const { queryClient } = context;

    const service = await queryClient
      .ensureQueryData(apiQueryFn('getService', { path: { id: params.serviceId } }))
      .then(({ service }) => mapService(service!));

    const queries = new Array<ReturnType<typeof apiQueryFn>>();

    queries.push(apiQueryFn('getApp', { path: { id: service.appId } }));
    queries.push(apiQueryFn('getDeployment', { path: { id: service.latestDeploymentId } }));

    queries.push(
      apiQueryFn('listDeployments', {
        query: {
          service_id: service.id,
          limit: String(10),
          offset: String(0),
          statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
        },
      }),
    );

    if (service.activeDeploymentId) {
      queries.push(apiQueryFn('getDeployment', { path: { id: service.activeDeploymentId } }));
    }

    await Promise.all(queries.map((query) => queryClient.ensureQueryData(query)));
  },
});
