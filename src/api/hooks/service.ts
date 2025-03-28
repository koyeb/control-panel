import { useQuery } from '@tanstack/react-query';

import { assert } from 'src/utils/assert';
import { upperCase } from 'src/utils/strings';

import {
  isComputeDeployment,
  mapDeployment,
  mapInstances,
  mapRegionalDeployment,
} from '../mappers/deployment';
import { mapApp, mapApps, mapService, mapServices } from '../mappers/service';
import { InstanceStatus } from '../model';
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

export function useComputeDeployment(deploymentId: string | undefined) {
  const deployment = useDeploymentQuery(deploymentId).data;

  assert(isComputeDeployment(deployment));

  return deployment;
}

export function useRegionalDeploymentsQuery(deploymentId: string | undefined) {
  return useQuery({
    ...useApiQueryFn('listRegionalDeployments', { query: { deployment_id: deploymentId } }),
    enabled: deploymentId !== undefined,
    select: ({ regional_deployments }) => regional_deployments!.map(mapRegionalDeployment),
  });
}

export function useRegionalDeployments(deploymentId: string | undefined) {
  return useRegionalDeploymentsQuery(deploymentId).data;
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
