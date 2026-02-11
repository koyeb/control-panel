import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { ComputeDeployment, DeploymentStatus, InstanceStatus } from 'src/model';
import { createArray } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { useApi } from '../index';
import {
  isComputeDeployment,
  mapDeployment,
  mapInstance,
  mapRegionalDeployment,
  mapReplica,
} from '../mappers/deployment';
import { mapService } from '../mappers/service';
import { apiQuery, getApiQueryKey } from '../query';

export function useServicesQuery(appId?: string) {
  return useQuery({
    ...apiQuery('get /v1/services', { query: { limit: '100', app_id: appId } }),
    refetchInterval: 5_000,
    select: ({ services }) => services!.map(mapService),
  });
}

export function useServices(appId?: string) {
  return useServicesQuery(appId).data;
}

export function useServiceQuery(serviceId?: string) {
  return useQuery({
    ...apiQuery('get /v1/services/{id}', { path: { id: serviceId! } }),
    enabled: serviceId !== undefined,
    refetchInterval: 5_000,
    select: ({ service }) => mapService(service!),
  });
}

export function useService(serviceId?: string) {
  return useServiceQuery(serviceId).data;
}

export function useServiceScalingQuery(serviceId: string) {
  return useQuery({
    ...apiQuery('get /v1/services/{id}/scale', { path: { id: serviceId } }),
    select: (data) => data.scalings?.[0] ?? null,
  });
}

export function useServiceScaling(serviceId: string) {
  return useServiceScalingQuery(serviceId).data;
}

export function useDeploymentsQuery(serviceId: string, statuses?: DeploymentStatus[]) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: getApiQueryKey('get /v1/deployments', {
      query: {
        service_id: serviceId,
        statuses,
      },
    }),

    async queryFn({ queryKey: [, { query }], pageParam }) {
      return api('get /v1/deployments', {
        query: {
          limit: String(10),
          offset: String(10 * pageParam),
          ...query,
        },
      });
    },

    initialPageParam: 0,
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      const nextPage = lastPageParam + 1;

      if (nextPage * lastPage.limit! >= lastPage.count!) {
        return undefined;
      }

      return nextPage;
    },

    refetchInterval: 5_000,

    select({ pages }) {
      return {
        count: pages[0]!.count!,
        deployments: pages.flatMap((page) => page.deployments!.map(mapDeployment)),
      };
    },
  });
}

export function useDeploymentQuery(deploymentId: string | undefined) {
  return useQuery({
    ...apiQuery('get /v1/deployments/{id}', { path: { id: deploymentId as string } }),
    enabled: deploymentId !== undefined,
    refetchInterval: 5_000,
    select: ({ deployment }) => mapDeployment(deployment!),
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
    ...apiQuery('get /v1/regional_deployments', { query: { deployment_id: deploymentId } }),
    enabled: deploymentId !== undefined,
    refetchInterval: 5_000,
    select: ({ regional_deployments }) => regional_deployments!.map(mapRegionalDeployment),
  });
}

export function useRegionalDeployments(deploymentId: string | undefined) {
  return useRegionalDeploymentsQuery(deploymentId).data;
}

export function useRegionalDeployment(deploymentId: string | undefined, region: string) {
  return useRegionalDeployments(deploymentId)?.find(hasProperty('region', region));
}

type DeploymentScalingFilters = {
  statuses?: InstanceStatus[];
  regions?: string[];
};

type DeploymentScalingOptions = {
  filters?: DeploymentScalingFilters;
  refetchInterval?: number;
};

export function useDeploymentScalingQuery(
  deployment?: ComputeDeployment,
  { filters, refetchInterval = 5_000 }: DeploymentScalingOptions = {},
) {
  const deploymentId = deployment?.id;

  return useQuery({
    ...apiQuery('get /v1/instances', {
      query: {
        deployment_id: deploymentId,
        statuses: filters?.statuses ?? [
          'ALLOCATING',
          'STARTING',
          'HEALTHY',
          'UNHEALTHY',
          'STOPPING',
          'SLEEPING',
        ],
        limit: '100',
      },
    }),
    refetchInterval,
    enabled: deploymentId !== undefined,
    placeholderData: keepPreviousData,
    select: ({ instances }) => {
      assert(deployment !== undefined);
      assert(instances !== undefined);

      const regions = filters?.regions ?? deployment.definition.regions;

      return regions
        .slice()
        .sort()
        .flatMap((region) => {
          const regionInstances = instances.filter((instance) => instance.region === region);
          const maxReplicaIndex = Math.max(
            -1,
            ...regionInstances.map(({ replica_index }) => replica_index ?? 0),
          );
          const replicasCount = Math.max(deployment.definition.scaling.max, maxReplicaIndex + 1);

          return createArray(replicasCount, (index) => ({
            region,
            replica_index: index,
            instances: regionInstances.filter(({ replica_index }) => replica_index === index),
          }));
        })
        .map(mapReplica);
    },
  });
}

export function useDeploymentScaling(deployment?: ComputeDeployment, options?: DeploymentScalingOptions) {
  return useDeploymentScalingQuery(deployment, options).data;
}

type InstancesQueryOptions = {
  serviceId?: string;
  deploymentId?: string;
  regionalDeploymentId?: string;
  statuses?: InstanceStatus[];
  replicaIndex?: number;
  limit?: number;
  offset?: number;
};

export function useInstancesQuery({
  serviceId,
  deploymentId,
  regionalDeploymentId,
  statuses,
  replicaIndex,
  limit = 100,
  offset,
}: InstancesQueryOptions = {}) {
  return useQuery({
    ...apiQuery('get /v1/instances', {
      query: {
        service_id: serviceId,
        deployment_id: deploymentId,
        regional_deployment_id: regionalDeploymentId,
        replica_index: replicaIndex !== undefined ? String(replicaIndex) : undefined,
        limit: String(limit),
        offset: offset !== undefined ? String(offset) : undefined,
        order: 'desc',
        statuses,
      },
    }),
    placeholderData: keepPreviousData,
    enabled: serviceId !== undefined || deploymentId !== undefined || regionalDeploymentId !== undefined,
    refetchInterval: 5_000,
    select: ({ count, instances }) => ({
      instances: instances!.map((instance) => mapInstance(instance)),
      count: count!,
    }),
  });
}

export function useInstanceQuery(instanceId: string) {
  return useQuery({
    ...apiQuery('get /v1/instances/{id}', { path: { id: instanceId } }),
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
    select: ({ instance }) => mapInstance(instance!),
  });
}
