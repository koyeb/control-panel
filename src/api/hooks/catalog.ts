import { useQuery } from '@tanstack/react-query';
import sortBy from 'lodash-es/sortBy';

import { getConfig } from 'src/application/config';
import { parseBytes } from 'src/application/memory';
import { hasProperty } from 'src/utils/object';

import { mapCatalogInstancesList, mapCatalogRegionsList } from '../mappers/catalog';
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

type OneClickAppApiResponse = {
  category: string;
  name: string;
  logos: [string, ...string[]];
  description: string;
  repository: string;
  deploy_button_url: string;
  slug: string;
  model_name?: string;
  model_size?: string;
  model_inference_engine?: string;
  model_docker_image?: string;
  model_min_vram_gb?: number;
};

async function fetchOneClickApps() {
  const { websiteUrl } = getConfig();
  const response = await fetch(`${websiteUrl}/api/get-one-click-apps`, { mode: 'cors' });

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
    repository: app.repository,
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
    name: app.model_name!,
    slug: app.slug,
    description: app.description,
    dockerImage: app.model_docker_image!,
    parameters: app.model_size!,
    engine: app.model_inference_engine!,
    min_vram: parseBytes(app.model_min_vram_gb + 'GB'),
  };
}

export function useModels() {
  const { data } = useModelsQuery();

  return sortBy(data, 'name');
}

export function useModel(slug?: string) {
  return useModels().find(hasProperty('slug', slug));
}
