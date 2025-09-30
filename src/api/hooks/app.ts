import { useQuery } from '@tanstack/react-query';

import { apiQuery } from 'src/api/api';
import { getApi } from 'src/application/container';

import { mapDeployment } from '../mappers/deployment';
import { mapApp, mapService } from '../mappers/service';
import { AppFull } from '../model';

export function useAppsQuery() {
  return useQuery({
    ...apiQuery('get /v1/apps', { query: { limit: '100' } }),
    select: ({ apps }) => apps!.map(mapApp),
  });
}

export function useApps() {
  return useAppsQuery().data;
}

export function useAppQuery(appId?: string) {
  return useQuery({
    ...apiQuery('get /v1/apps/{id}', { path: { id: appId! } }),
    enabled: appId !== undefined,
    select: ({ app }) => mapApp(app!),
  });
}

export function useApp(appId?: string) {
  return useAppQuery(appId).data;
}

export function useAppsFull() {
  return useQuery({
    queryKey: ['listAppsFull'],
    async queryFn({ signal }) {
      const api = getApi();

      const [apps, services] = await Promise.all([
        api('get /v1/apps', { query: { limit: '100' } }, { signal }),
        api('get /v1/services', { query: { limit: '100' } }, { signal }),
      ]);

      const deployments = await Promise.all(
        services
          .services!.flatMap((service) => [service.active_deployment_id!, service.latest_deployment_id!])
          .filter((id) => id !== '')
          .map((id) => api('get /v1/deployments/{id}', { path: { id } }), { signal }),
      );

      return {
        apps,
        services,
        deployments,
      };
    },
    select(results): AppFull[] {
      const apps = results.apps.apps!.map(mapApp);
      const services = results.services.services!.map(mapService);

      const deployments = new Map(
        results.deployments
          .map(({ deployment }) => mapDeployment(deployment!))
          .map((deployment) => [deployment.id, deployment]),
      );

      return apps.map((app) => ({
        ...app,
        services: services
          .filter((service) => service.appId === app.id)
          .map((service) => ({
            ...service,
            activeDeployment: deployments.get(service.activeDeploymentId ?? ''),
            latestDeployment: deployments.get(service.latestDeploymentId)!,
          })),
      }));
    },
  });
}
