import { Outlet, createFileRoute } from '@tanstack/react-router';

import { mapService } from 'src/api/mappers/service';
import { createEnsureApiQueryData } from 'src/api/use-api';
import { ServiceLayout } from 'src/pages/service/service.layout';

export const Route = createFileRoute('/_main/services/$serviceId')({
  component: () => (
    <ServiceLayout>
      <Outlet />
    </ServiceLayout>
  ),

  async loader({ context: { queryClient }, params, abortController }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient, abortController);

    const service = await ensureApiQueryData('getService', { path: { id: params.serviceId } }).then(
      (result) => mapService(result.service!),
    );

    const { appId, latestDeploymentId, activeDeploymentId } = service;

    await Promise.all([
      ensureApiQueryData('getApp', { path: { id: appId } }),
      ensureApiQueryData('getDeployment', { path: { id: latestDeploymentId } }),
      activeDeploymentId && ensureApiQueryData('getDeployment', { path: { id: activeDeploymentId } }),
    ]);
  },
});
