import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { ApiFn, useApi } from 'src/api';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { AppList, ServiceStatus, ServiceType } from 'src/model';
import { exclude } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

import { mapDeployment } from '../mappers/deployment';
import { mapApp, mapService } from '../mappers/service';
import { apiQuery } from '../query';

export function useAppsQuery() {
  return useQuery({
    ...apiQuery('get /v1/apps', { query: { limit: '100' } }),
    refetchInterval: 5_000,
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
    refetchInterval: 5_000,
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
  const api = useApi();

  return useQuery({
    queryKey: ['listAppsFull', { filters, api }],
    queryFn: ({ signal }) => listAppsFull(api, filters, signal),
    placeholderData: keepPreviousData,
    refetchInterval(query) {
      const servicesCount = query.state.data?.services.count ?? 0;

      if (servicesCount <= 5) {
        return 5_000;
      }

      if (servicesCount <= 50) {
        return 30_000;
      }

      return 60_000;
    },
    select(results): AppList {
      const apps = results.apps
        .apps!.map(mapApp)
        .filter((app) => results.services.services!.find(hasProperty('app_id', app.id)));

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
        results.latestDeployments.map(mapDeployment).map((deployment) => [deployment.serviceId, deployment]),
      );

      return {
        apps,
        services,
        latestDeployments,
        activeDeployments,
      };
    },
  });
}

export async function listAppsFull(api: ApiFn, filters: AppsFullFilters = {}, signal?: AbortSignal) {
  if (filters.types?.length === 0 || filters.statuses?.length === 0) {
    return { apps: { apps: [] }, services: { services: [] }, activeDeployments: [], latestDeployments: [] };
  }

  const [apps, services, deployments] = await Promise.all([
    api('get /v1/apps', { query: { limit: '100' } }, { signal }),
    api('get /v1/services', { query: { limit: '100', ...filters } }, { signal }),
    api('get /v1/deployments', { query: { limit: '100' } }, { signal }),
  ]);

  const findDeployment = async (deploymentId: string) => {
    const deployment = deployments.deployments!.find(hasProperty('id', deploymentId));

    if (deployment) {
      return deployment;
    }

    return api('get /v1/deployments/{id}', { path: { id: deploymentId } }, { signal }).then(
      (response) => response.deployment!,
    );
  };

  const findLatestNonStashedDeployment = async (serviceId: string) => {
    const deployment = deployments.deployments!.find(
      (deployment) => deployment.service_id === serviceId && deployment.status !== 'STASHED',
    );

    if (deployment) {
      return deployment;
    }

    const statuses = exclude(allApiDeploymentStatuses, 'STASHED');

    return api(
      'get /v1/deployments',
      { query: { service_id: serviceId, statuses, limit: '1' } },
      { signal },
    ).then((response) => response.deployments![0]!);
  };

  const [activeDeployments, latestDeployments] = await Promise.all([
    Promise.all(
      services
        .services!.map((service) => service.active_deployment_id!)
        .filter(Boolean)
        .map(findDeployment),
    ),
    Promise.all(services.services!.map((service) => findLatestNonStashedDeployment(service.id!))),
  ]);

  return {
    apps,
    services,
    activeDeployments,
    latestDeployments,
  };
}
