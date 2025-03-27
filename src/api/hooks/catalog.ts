import { useQuery } from '@tanstack/react-query';
import sortBy from 'lodash-es/sortBy';

import { getConfig } from 'src/application/config';
import { parseBytes } from 'src/application/memory';
import { hasProperty } from 'src/utils/object';

import {
  mapCatalogDatacentersList,
  mapCatalogInstancesList,
  mapCatalogRegionsList,
  mapCatalogUsage,
} from '../mappers/catalog';
import { AiModel, OneClickApp } from '../model';
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

export function useInstances(ids?: string[]) {
  const { data: instances = [] } = useInstancesQuery();

  if (ids === undefined) {
    return instances;
  }

  return instances.filter((instance) => ids.includes(instance.id));
}

export function useInstance(id: string | null) {
  return useInstances().find(hasProperty('id', id));
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

export function useRegions(ids?: string[]) {
  const { data: regions = [] } = useRegionsQuery();

  if (ids === undefined) {
    return regions;
  }

  return regions.filter((region) => ids.includes(region.id));
}

export function useRegion(id?: string) {
  return useRegions().find(hasProperty('id', id));
}

export function useDatacentersQuery() {
  return useQuery({
    ...useApiQueryFn('listCatalogDatacenters'),
    refetchInterval: false,
    select: mapCatalogDatacentersList,
  });
}

export function useDatacenters() {
  const { data: datacenters = [] } = useDatacentersQuery();

  return datacenters;
}

export function useCatalogUsageQuery() {
  return useQuery({
    ...useApiQueryFn('listCatalogUsage'),
    refetchInterval: false,
    select: ({ usage }) => mapCatalogUsage(usage!),
  });
}

export function useCatalogInstanceAvailability(instanceId?: string) {
  const { data } = useCatalogUsageQuery();

  if (instanceId !== undefined) {
    return data?.get(instanceId);
  }
}

export function useCatalogRegionAvailability(instanceId?: string, regionId?: string) {
  const { data } = useCatalogUsageQuery();

  if (instanceId !== undefined && regionId !== undefined) {
    return data?.get(instanceId)?.byRegion?.get(regionId);
  }
}

type OneClickAppApiResponse = {
  category: string;
  name: string;
  logos: [string, ...string[]];
  description: string;
  repository: string;
  deploy_button_url: string;
  slug: string;
  env?: Array<{ name: string; value: string }>;
  model_name?: string;
  model_size?: string;
  model_inference_engine?: string;
  model_docker_image?: string;
  model_min_vram_gb?: number;
  metadata?: Array<{ name: string; value: string }>;
};

async function fetchOneClickApps() {
  const { websiteUrl } = getConfig();
  const response = await fetch(`${websiteUrl}/api/one-click-apps.json`, { mode: 'cors' });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as OneClickAppApiResponse[];
}

export function useOneClickAppsQuery() {
  return useQuery({
    refetchInterval: false,
    queryKey: ['listOneClickApps'],
    queryFn: fetchOneClickApps,
    select: (apps) => apps.map(mapOneClickApp),
  });
}

function mapOneClickApp(app: OneClickAppApiResponse): OneClickApp {
  return {
    name: app.name,
    slug: app.slug,
    description: app.description,
    logo: app.logos[0],
    deployUrl: getOneClickAppUrl(app.slug, app.deploy_button_url),
  };
}

export function useOneClickApps(): OneClickApp[] {
  return useOneClickAppsQuery().data ?? [];
}

function getOneClickAppUrl(appSlug: string, appUrl: string): string {
  const url = new URL(appUrl);

  url.protocol = window.location.protocol;
  url.host = window.location.host;

  // url.searchParams.set('one_click_app', appSlug);

  return url.toString();
}

export function useModelsQuery() {
  return useQuery({
    refetchInterval: false,
    queryKey: ['listOneClickApps'],
    queryFn: fetchOneClickApps,
    select: (apps) => apps.filter((app) => app.category === 'Model').map(mapOneClickModel),
  });
}

function mapOneClickModel(app: OneClickAppApiResponse): AiModel {
  return {
    name: app.name,
    slug: app.slug,
    description: app.description,
    logo: app.logos[0],
    dockerImage: app.model_docker_image!,
    minVRam: parseBytes(app.model_min_vram_gb + 'GB'),
    metadata: app.metadata ?? [],
    env: app.env?.map((env) => ({ name: env.name, value: env.value, regions: [] })),
  };
}

export function useModels() {
  const { data } = useModelsQuery();

  return sortBy(data, 'name');
}

export function useModel(slug?: string) {
  return useModels().find(hasProperty('slug', slug));
}
