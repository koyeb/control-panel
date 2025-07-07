import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { mapDeployment } from 'src/api/mappers/deployment';
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

  loader: async ({ context, params, deps }) => {
    const { ensureQueryData } = context;
    console.log(context);

    const [, deployments] = await Promise.all([
      ensureQueryData('getService', { path: { id: params.serviceId } }),
      ensureQueryData('listDeployments', {
        query: {
          service_id: params.serviceId,
          limit: String(10),
          offset: String(0),
          statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
        },
      }).then(({ deployments }) => deployments!.map(mapDeployment)),
    ]);

    if (deps.deploymentId === undefined && deployments[0]) {
      throw redirect({
        to: '/services/$serviceId',
        params,
        search: (prev) => ({ ...prev, deploymentId: deployments[0]!.id }),
      });
    }
  },
});
