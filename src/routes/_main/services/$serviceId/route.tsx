import { Outlet, createFileRoute } from '@tanstack/react-router';

import { createEnsureApiQueryData } from 'src/api/api';
import { mapService } from 'src/api/mappers/service';
import { AppServiceCrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceLayout } from 'src/pages/service/service.layout';

export const Route = createFileRoute('/_main/services/$serviceId')({
  component: () => (
    <ServiceLayout>
      <Outlet />
    </ServiceLayout>
  ),

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <AppServiceCrumb serviceId={params.serviceId} link={{ to: Route.fullPath, params }} />,
  }),

  async loader({ context: { queryClient }, params, abortController }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient, abortController);

    const service = await ensureApiQueryData('get /v1/services/{id}', {
      path: { id: params.serviceId },
    }).then((result) => mapService(result.service!));

    const { appId, latestDeploymentId, activeDeploymentId } = service;
    const promises = new Set<Promise<unknown>>();

    promises.add(ensureApiQueryData('get /v1/apps/{id}', { path: { id: appId } }));
    promises.add(ensureApiQueryData('get /v1/deployments/{id}', { path: { id: latestDeploymentId } }));

    if (activeDeploymentId) {
      promises.add(ensureApiQueryData('get /v1/deployments/{id}', { path: { id: activeDeploymentId } }));
    }

    await Promise.all(promises);
  },
});
