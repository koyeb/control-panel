import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapDeployment, mapInstances } from '../mappers/deployment';
import { mapApp, mapApps, mapService, mapServices } from '../mappers/service';
import { ExampleApp, InstanceStatus } from '../model';
import { useApiQueryFn } from '../use-api';

export function useAppsQuery() {
  return useQuery({
    ...useApiQueryFn('listApps', { query: { limit: '100' } }),
    select: mapApps,
  });
}

export function useApps() {
  return useAppsQuery().data;
}

export function useAppQuery(appId?: string) {
  return useQuery({
    ...useApiQueryFn('getApp', { path: { id: appId! } }),
    enabled: appId !== undefined,
    select: mapApp,
  });
}

export function useApp(appId?: string) {
  return useAppQuery(appId).data;
}

export function useServicesQuery(appId?: string) {
  return useQuery({
    ...useApiQueryFn('listServices', { query: { limit: '100', app_id: appId } }),
    select: mapServices,
  });
}

export function useServices(appId?: string) {
  return useServicesQuery(appId).data;
}

export function useServiceQuery(serviceId?: string) {
  return useQuery({
    ...useApiQueryFn('getService', { path: { id: serviceId! } }),
    enabled: serviceId !== undefined,
    select: mapService,
  });
}

export function useService(serviceId?: string) {
  return useServiceQuery(serviceId).data;
}

export function useDeploymentQuery(deploymentId: string | undefined) {
  return useQuery({
    ...useApiQueryFn('getDeployment', { path: { id: deploymentId as string } }),
    enabled: deploymentId !== undefined,
    select: mapDeployment,
  });
}

export function useDeployment(deploymentId: string | undefined) {
  return useDeploymentQuery(deploymentId).data;
}

type InstancesQueryOptions = {
  deploymentId?: string;
  serviceId?: string;
  status?: InstanceStatus;
};

export function useInstancesQuery({ deploymentId, serviceId, status }: InstancesQueryOptions = {}) {
  return useQuery({
    ...useApiQueryFn('listInstances', {
      query: {
        deployment_id: deploymentId,
        service_id: serviceId,
        limit: '100',
        order: 'desc',
        statuses: status ? [upperCase(status)] : undefined,
      },
    }),
    enabled: deploymentId !== undefined || serviceId !== undefined,
    select: mapInstances,
  });
}

type ExampleAppApiResponse = {
  name: string;
  logos: [string, ...string[]];
  description: string;
  repository: string;
  deploy_button_url: string;
  slug: string;
};

export function useExampleAppsQuery() {
  return useQuery({
    queryKey: ['listExampleApps'],
    async queryFn() {
      const response = await fetch('https://www.koyeb.com/api/get-one-click-apps', { mode: 'cors' });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as ExampleAppApiResponse[];
    },
    select: (apps) => {
      return apps.map((app) => ({
        name: app.name,
        slug: app.slug,
        description: app.description,
        logo: app.logos[0],
        repository: app.repository,
        deployUrl: getExampleAppUrl(app.slug, app.deploy_button_url),
      }));
    },
  });
}

export function useExampleApps(): ExampleApp[] {
  return useExampleAppsQuery().data ?? [];
}

function getExampleAppUrl(appSlug: string, appUrl: string): string {
  const url = new URL(appUrl);

  url.protocol = window.location.protocol;
  url.host = window.location.host;

  // url.searchParams.set('example_app', appSlug);

  return url.toString();
}
