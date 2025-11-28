import { getApi } from '..';
import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { DeploymentStatus, InstanceStatus } from 'src/model';
import { createArray } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { API } from '../api-types';
import {
  isComputeDeployment,
  mapDeployment,
  mapInstance,
  mapRegionalDeployment,
  mapReplica,
} from '../mappers/deployment';
import { mapService } from '../mappers/service';
import { apiQuery } from '../query';

export function useServicesQuery(appId?: string) {
  return useQuery({
    ...apiQuery('get /v1/services', { query: { limit: '100', app_id: appId } }),
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
    select: ({ service }) => mapService(service!),
  });
}

export function useService(serviceId?: string) {
  return useServiceQuery(serviceId).data;
}

export function useDeploymentsQuery(serviceId: string, statuses?: DeploymentStatus[]) {
  return useQuery({
    ...apiQuery('get /v1/deployments', { query: { service_id: serviceId, statuses } }),
    select: ({ deployments }) => deployments!.map(mapDeployment),
  });
}

export function useDeployments(serviceId: string, statuses?: DeploymentStatus[]) {
  return useDeploymentsQuery(serviceId, statuses).data;
}

export function useDeploymentsInfiniteQuery(serviceId: string) {
  return useInfiniteQuery({
    ...apiQuery('get /v1/deployments', {
      query: {
        service_id: serviceId,
        statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
      },
    }),
    async queryFn({ queryKey: [, { query }], pageParam }) {
      const api = getApi();

      return api('get /v1/deployments', {
        query: {
          ...query,
          limit: String(10),
          offset: String(10 * pageParam),
        },
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      const nextPage = lastPageParam + 1;

      if (nextPage * 10 >= lastPage.count!) {
        return undefined;
      }

      return nextPage;
    },
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

export function useDeploymentScalingQuery(deploymentId?: string, filters?: DeploymentScalingFilters) {
  const queryClient = useQueryClient();

  return useQuery({
    enabled: deploymentId !== undefined,
    placeholderData: keepPreviousData,
    queryKey: ['deploymentScaling', { deploymentId, filters }],
    queryFn: async (): Promise<
      Array<{ instances: API.Instance[]; region: string; replica_index: number }>
    > => {
      const { deployment } = await queryClient.fetchQuery(
        apiQuery('get /v1/deployments/{id}', { path: { id: deploymentId! } }),
      );

      const { instances } = await queryClient.fetchQuery(
        apiQuery('get /v1/instances', {
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
      );

      const regions = filters?.regions ?? deployment!.definition!.regions!;
      const replicasCount = deployment!.definition!.scalings![0]!.max!;

      const getReplica = (region: string, index: number) => ({
        region,
        replica_index: index,
        instances: instances!.filter(
          (instance) => instance.region === region && instance.replica_index === index,
        ),
      });

      return regions
        .slice()
        .sort()
        .flatMap((region) => createArray(replicasCount, (index) => getReplica(region, index)));
    },
    select: (replicas) => replicas.map(mapReplica),
  });
}

export function useDeploymentScaling(deploymentId?: string, filters?: DeploymentScalingFilters) {
  return useDeploymentScalingQuery(deploymentId, filters).data;
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
    select: ({ instance }) => mapInstance(instance!),
  });
}
