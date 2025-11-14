import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import { createEnsureApiQueryData, mapService, useServiceQuery } from 'src/api';
import { QueryGuard } from 'src/components/query-error';
import { SandboxDetails } from 'src/modules/sandbox/details/sandbox-details';

export const Route = createFileRoute('/_main/sandboxes/$serviceId/')({
  component: SandboxDetailsRoute,

  validateSearch: z.object({
    deploymentId: z.string().optional(),
  }),

  loaderDeps: ({ search }) => ({
    deploymentId: search.deploymentId,
  }),

  async loader({ params, deps, context: { queryClient } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    if (deps.deploymentId === undefined) {
      const service = await ensureApiQueryData('get /v1/services/{id}', {
        path: { id: params.serviceId },
      }).then((result) => mapService(result.service!));

      throw redirect({
        to: '/sandboxes/$serviceId',
        params,
        search: (prev) => ({ ...prev, deploymentId: service.latestDeploymentId }),
      });
    }
  },
});

function SandboxDetailsRoute() {
  const { serviceId } = Route.useParams();
  const serviceQuery = useServiceQuery(serviceId);

  return <QueryGuard query={serviceQuery}>{(service) => <SandboxDetails service={service} />}</QueryGuard>;
}
