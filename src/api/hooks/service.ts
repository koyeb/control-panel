import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { upperCase } from 'src/utils/strings';

import {
  isComputeDeployment,
  mapDeployment,
  mapInstance,
  mapRegionalDeployment,
  mapReplica,
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

  if (deployment !== undefined) {
    assert(isComputeDeployment(deployment));
  }

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

export function useRegionalDeployment(deploymentId: string | undefined, region: string) {
  return useRegionalDeployments(deploymentId)?.find(hasProperty('region', region));
}

export function useDeploymentScalingQuery(deploymentId: string | undefined, filters?: { region?: string }) {
  return useQuery({
    ...useApiQueryFn('getDeploymentScaling', {
      path: { id: deploymentId! },
      query: { ...filters },
    }),
    enabled: deploymentId !== undefined,
    placeholderData: keepPreviousData,
    select: ({ replicas }) => replicas!.map(mapReplica),
  });
}

export function useDeploymentScaling(deploymentId: string | undefined, filters?: { region?: string }) {
  const { data } = useDeploymentScalingQuery(deploymentId, filters);

  return data;
}

type InstancesQueryOptions = {
  serviceId?: string;
  deploymentId?: string;
  regionalDeploymentId?: string;
  status?: InstanceStatus;
  replicaIndex?: number;
  limit?: number;
  offset?: number;
};

export function useInstancesQuery({
  serviceId,
  deploymentId,
  regionalDeploymentId,
  status,
  replicaIndex,
  limit = 100,
  offset,
}: InstancesQueryOptions = {}) {
  return useQuery({
    ...useApiQueryFn('listInstances', {
      query: {
        service_id: serviceId,
        deployment_id: deploymentId,
        regional_deployment_id: regionalDeploymentId,
        replica_index: replicaIndex !== undefined ? String(replicaIndex) : undefined,
        limit: String(limit),
        offset: offset !== undefined ? String(offset) : undefined,
        order: 'desc',
        statuses: status ? [upperCase(status)] : undefined,
      },
    }),
    placeholderData: keepPreviousData,
    enabled: serviceId !== undefined || deploymentId !== undefined || regionalDeploymentId !== undefined,
    select: ({ count, instances }) => ({
      instances: instances!.map((instance) => mapInstance(instance)),
      count: count!,
    }),
  });
}
