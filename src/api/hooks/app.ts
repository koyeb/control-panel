import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getApi } from 'src/api';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { AppList, ServiceStatus, ServiceType } from 'src/model';
import { hasProperty } from 'src/utils/object';

import { mapDeployment, mapReplica } from '../mappers/deployment';
import { mapApp, mapService } from '../mappers/service';
import { apiQuery } from '../query';

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

type AppsFullFilters = Partial<{
  name: string;
  types: Uppercase<ServiceType>[];
  statuses: ServiceStatus[];
}>;

export function useAppsFull(filters: AppsFullFilters = {}) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ['listAppsFull', { filters }],
    queryFn: ({ signal }) => listAppsFull(filters, signal),
    select(results): AppList {
      const apps = results.apps.apps!.map(mapApp);

      const services = new Map(
        apps.map((app) => [
          app.id,
          results.services.services!.map(mapService).filter(hasProperty('appId', app.id)),
        ]),
      );

      const activeDeployments = new Map(
        results.activeDeployments.map(mapDeployment).map((deployment) => [deployment.serviceId, deployment]),
      );

      const latestDeployments = new Map(
        results.latestNonStashedDeployments
          .map(mapDeployment)
          .map((deployment) => [deployment.serviceId, deployment]),
      );

      const activeDeploymentsReplicas = new Map(
        results.scalings.map(({ serviceId, scaling }) => [serviceId, scaling.replicas!.map(mapReplica)]),
      );

      return {
        apps,
        services,
        latestDeployments,
        activeDeployments,
        activeDeploymentsReplicas,
      };
    },
  });
}

export async function listAppsFull(filters: AppsFullFilters = {}, signal?: AbortSignal) {
  const api = getApi();

  if (filters.types?.length === 0 || filters.statuses?.length === 0) {
    return {
      apps: { apps: [] },
      services: { services: [] },
      activeDeployments: [],
      latestNonStashedDeployments: [],
      scalings: [],
    };
  }

  const [apps, services] = await Promise.all([
    api('get /v1/apps', { query: { limit: '100' } }, { signal }),
    api('get /v1/services', { query: { limit: '100', ...filters } }, { signal }),
  ]);

  const activeDeploymentsPromises = services
    .services!.map((service) => service.active_deployment_id!)
    .filter((deploymentId) => deploymentId !== '')
    .map(
      async (deploymentId) => {
        const { deployment } = await api('get /v1/deployments/{id}', {
          path: { id: deploymentId },
        });

        return deployment!;
      },
      { signal },
    );

  const latestNonStashedDeploymentsPromises = services.services!.map(
    async (service) => {
      const { deployments } = await api('get /v1/deployments', {
        query: {
          service_id: service.id,
          statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
          limit: '1',
        },
      });

      return deployments![0]!;
    },
    { signal },
  );

  const [activeDeployments, latestNonStashedDeployments] = await Promise.all([
    Promise.all(activeDeploymentsPromises),
    Promise.all(latestNonStashedDeploymentsPromises),
  ]);

  const scalings = await Promise.all(
    activeDeployments.map(async (deployment) => ({
      serviceId: deployment.service_id!,
      scaling: await api('get /v1/deployment/{id}/scaling', {
        path: { id: deployment.id! },
      }),
    })),
  );

  return {
    apps,
    services,
    activeDeployments,
    latestNonStashedDeployments,
    scalings,
  };
}
