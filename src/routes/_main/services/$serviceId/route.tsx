import { Outlet, createFileRoute } from '@tanstack/react-router';

import { mapService } from 'src/api/mappers/service';
import { createEnsureApiQueryData } from 'src/api/use-api';
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

    const service = await ensureApiQueryData('getService', { path: { id: params.serviceId } }).then(
      (result) => mapService(result.service!),
    );

    const { appId, latestDeploymentId, activeDeploymentId } = service;
    const promises = new Set<Promise<unknown>>();

    promises.add(ensureApiQueryData('getApp', { path: { id: appId } }));
    promises.add(ensureApiQueryData('getDeployment', { path: { id: latestDeploymentId } }));

    if (activeDeploymentId) {
      promises.add(ensureApiQueryData('getDeployment', { path: { id: activeDeploymentId } }));
    }

    await Promise.all(promises);
  },
});
