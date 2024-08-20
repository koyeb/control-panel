import { useQuery } from '@tanstack/react-query';

import { hasProperty } from 'src/utils/object';

import { mapCatalogInstancesList, mapCatalogRegionsList } from '../mappers/catalog';
import { useApiQueryFn } from '../use-api';

export function useInstancesQuery() {
  return useQuery({
    ...useApiQueryFn('listCatalogInstances', {
      query: { limit: '100' },
    }),
    refetchInterval: false,
    select: mapCatalogInstancesList,
  });
}

export function useInstances(identifiers?: string) {
  const { data: instances = [] } = useInstancesQuery();

  if (identifiers === undefined) {
    return instances;
  }

  return instances.filter((instance) => identifiers.includes(instance.identifier));
}

export function useInstance(identifier: string | null) {
  return useInstances().find(hasProperty('identifier', identifier));
}

export function useRegionsQuery() {
  return useQuery({
    ...useApiQueryFn('listCatalogRegions', {
      query: { limit: '100' },
    }),
    refetchInterval: false,
    select: mapCatalogRegionsList,
  });
}

export function useRegions(identifiers?: string[]) {
  const { data: regions = [] } = useRegionsQuery();

  if (identifiers === undefined) {
    return regions;
  }

  return regions.filter((region) => identifiers.includes(region.identifier));
}

export function useRegion(identifier?: string) {
  return useRegions().find(hasProperty('identifier', identifier));
}
