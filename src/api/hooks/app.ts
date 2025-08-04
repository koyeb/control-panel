import { useQuery } from '@tanstack/react-query';

import { mapDeployment } from '../mappers/deployment';
import { mapApp, mapService } from '../mappers/service';
import { AppFull } from '../model';
import { useApi, useApiQueryFn } from '../use-api';

export function useAppsQuery() {
  return useQuery({
    ...useApiQueryFn('listApps', { query: { limit: '100' } }),
    select: ({ apps }) => apps!.map(mapApp),
  });
}

export function useApps() {
  return useAppsQuery().data;
}

export function useAppQuery(appId?: string) {
  return useQuery({
    ...useApiQueryFn('getApp', { path: { id: appId! } }),
    enabled: appId !== undefined,
    select: ({ app }) => mapApp(app!),
  });
}

export function useApp(appId?: string) {
  return useAppQuery(appId).data;
}

export function useAppsFull() {
  const api = useApi();

  return useQuery({
    queryKey: ['listAppsFull', {}],
    async queryFn({ signal }) {
      const [apps, services] = await Promise.all([
        api.listApps({ signal, query: { limit: '100' } }),
        api.listServices({ signal, query: { limit: '100' } }),
      ]);

      const deployments = await Promise.all(
        services
          .services!.map((service) => service.latest_deployment_id!)
          .map((id) => api.getDeployment({ signal, path: { id } })),
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
          .map((service) => ({ ...service, latestDeployment: deployments.get(service.latestDeploymentId)! })),
      }));
    },
  });
}
