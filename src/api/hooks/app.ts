import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { API, ApiFn, useApi } from 'src/api';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { AppList, ServiceStatus, ServiceType } from 'src/model';
import { exclude } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

import { mapDeployment } from '../mappers/deployment';
import { mapApp, mapService } from '../mappers/service';
import { apiQuery, refetchInterval } from '../query';

export function useAppsQuery() {
  return useQuery({
    ...apiQuery('get /v1/apps', { query: { limit: '100' } }),
    refetchInterval: refetchInterval(),
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
    refetchInterval: refetchInterval(),
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
      const servicesCount = query.state.data?.services.length ?? 0;

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
        .map(mapApp)
        .filter((app) => results.services.find(hasProperty('app_id', app.id)));

      const services = new Map(
        apps.map((app) => [app.id, results.services.map(mapService).filter(hasProperty('appId', app.id))]),
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
    return { apps: [], services: [], activeDeployments: [], latestDeployments: [] };
  }

  const [apps, services, deployments] = await Promise.all([
    listApps(api, signal),
    listServices(api, filters, signal),
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
        .map((service) => service.active_deployment_id!)
        .filter(Boolean)
        .map(findDeployment),
    ),
    Promise.all(services.map((service) => findLatestNonStashedDeployment(service.id!))),
  ]);

  return {
    apps,
    services,
    activeDeployments,
    latestDeployments,
  };
}

async function listApps(api: ApiFn, signal?: AbortSignal) {
  const apps: API.App[] = [];
  let hasNext = true;

  while (hasNext) {
    const response = await api(
      'get /v1/apps',
      { query: { limit: '100', offset: String(apps.length) } },
      { signal },
    );

    apps.push(...response.apps!);
    hasNext = response.has_next!;
  }

  return apps;
}

async function listServices(api: ApiFn, filters: AppsFullFilters, signal?: AbortSignal) {
  const services: API.Service[] = [];
  let hasNext = true;

  while (hasNext) {
    const response = await api(
      'get /v1/services',
      { query: { limit: '100', offset: String(services.length), ...filters } },
      { signal },
    );

    services.push(...response.services!);
    hasNext = response.has_next!;
  }

  return services;
}
