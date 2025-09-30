import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import sortBy from 'lodash-es/sortBy';

import { getConfig } from 'src/application/config';
import { parseBytes } from 'src/application/memory';
import {
  AiModel,
  CatalogAvailability,
  OneClickApp,
  OneClickAppEnv,
  OneClickAppMetadata,
  OneClickAppVolume,
} from 'src/model';
import { entries, hasProperty, snakeToCamelDeep } from 'src/utils/object';

import { ApiError } from '../api-error';
import {
  mapCatalogDatacenter,
  mapCatalogInstance,
  mapCatalogRegion,
  mapCatalogUsage,
} from '../mappers/catalog';
import { apiQuery } from '../query';

export function useInstancesCatalogQuery() {
  return useSuspenseQuery({
    ...apiQuery('get /v1/catalog/instances', {
      query: { limit: '100' },
    }),
    refetchInterval: false,
    select: ({ instances }) => {
      return instances!.map(mapCatalogInstance).sort((a, b) => (a.vram ?? 0) - (b.vram ?? 0));
    },
  });
}

export function useInstancesCatalog(ids?: string[]) {
  const { data: instances = [] } = useInstancesCatalogQuery();

  if (ids === undefined) {
    return instances;
  }

  return instances.filter((instance) => ids.includes(instance.id));
}

export function useCatalogInstance(id?: string | null) {
  return useInstancesCatalog().find(hasProperty('id', id));
}

export function useRegionsCatalogQuery() {
  return useSuspenseQuery({
    ...apiQuery('get /v1/catalog/regions', {
      query: { limit: '100' },
    }),
    refetchInterval: false,
    select: ({ regions }) => regions!.map(mapCatalogRegion),
  });
}

export function useRegionsCatalog(ids?: string[]) {
  const { data: regions = [] } = useRegionsCatalogQuery();

  if (ids === undefined) {
    return regions;
  }

  return regions.filter((region) => ids.includes(region.id));
}

export function useCatalogRegion(id?: string) {
  return useRegionsCatalog().find(hasProperty('id', id));
}

export function useDatacentersCatalogQuery() {
  return useSuspenseQuery({
    ...apiQuery('get /v1/catalog/datacenters', {}),
    refetchInterval: false,
    select: ({ datacenters }) => datacenters!.map(mapCatalogDatacenter),
  });
}

export function useDatacentersCatalog() {
  const { data: datacenters = [] } = useDatacentersCatalogQuery();

  return datacenters;
}

export function useCatalogUsageQuery() {
  return useQuery({
    ...apiQuery('get /v1/catalog/usage', {}),
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
    return data?.get(instanceId)?.byRegion.get(regionId);
  }
}

export function useCatalogInstanceRegionsAvailability(
  instanceId?: string,
  regionIds?: string[],
): CatalogAvailability | undefined {
  const instanceAvailability = useCatalogInstanceAvailability(instanceId);

  if (instanceAvailability === undefined) {
    return;
  }

  const regionAvailabilities = regionIds?.map((regionId) => instanceAvailability.byRegion.get(regionId));

  for (const availability of ['low', 'medium', 'high'] satisfies CatalogAvailability[]) {
    if (regionAvailabilities?.includes(availability)) {
      return availability;
    }
  }
}
export type ApiOneClickApp = {
  slug: string;
  cover: string;
  og: string;
  logos: string[];
  name: string;
  href: string;
  description: string;
  category: string;
  project_site?: string;
  developer?: string;
  publisher?: string;
  created_at: string;
  updated_at: string;
  repository: string;
  deploy_button_url: string;
  live_demo?: string;
  technologies: string[];
  official: boolean;
  featured?: boolean;
  model_min_vram_gb?: number;
  env?: OneClickAppEnv[];
  metadata?: OneClickAppMetadata[];
  template_volumes?: OneClickAppVolume[];
  template_definition?: Record<string, unknown>;
};

async function fetchOneClickApps(): Promise<ApiOneClickApp[]> {
  const websiteUrl = getConfig('websiteUrl');
  const response = await fetch(`${websiteUrl}/api/one-click-apps`, { mode: 'cors' });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return response.json();
}

async function fetchOneClickApp(slug: string): Promise<{ metadata: ApiOneClickApp; description: string }> {
  const websiteUrl = getConfig('websiteUrl');
  const response = await fetch(`${websiteUrl}/api/one-click-apps/${slug}`, { mode: 'cors' });

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(response, { status: 404, code: '', message: 'Not found' });
    }

    throw new Error(await response.text());
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return response.json();
}

export function useOneClickAppsQuery() {
  return useQuery({
    refetchInterval: false,
    queryKey: ['listOneClickApps'],
    queryFn: fetchOneClickApps,
    select: (apps) => apps.map(mapOneClickApp),
  });
}

export function useOneClickAppQuery(slug: string) {
  return useQuery({
    refetchInterval: false,
    queryKey: ['getOneClickApp', slug],
    retry: false,
    queryFn: () => fetchOneClickApp(slug),
    select: ({ metadata, description }) => ({
      metadata: mapOneClickApp(metadata),
      description,
    }),
  });
}

function mapOneClickApp(app: ApiOneClickApp): OneClickApp {
  const fallbackMetadata = () => {
    const metadata: Record<string, string> = {};

    metadata['Repository'] = app.repository;
    if (app.project_site) metadata['Website'] = app.project_site;
    if (app.developer) metadata['Developer'] = app.developer;
    metadata['Category'] = app.category;

    return entries(metadata).map(([name, value]) => ({ name, value }));
  };

  return {
    logo: app.logos[0]!,
    deployUrl: getOneClickAppUrl(app.slug, app.deploy_button_url),
    env: [],
    metadata: fallbackMetadata(),
    volumes: app.template_volumes ?? [],
    deploymentDefinition: app.template_definition ?? {},
    ...snakeToCamelDeep(app),
  };
}

export function useOneClickApps(): OneClickApp[] {
  return useOneClickAppsQuery().data ?? [];
}

function getOneClickAppUrl(appSlug: string, appUrl: string): string {
  const url = new URL(appUrl);

  url.protocol = window.location.protocol;
  url.host = window.location.host;

  // url.searchParams.set('one-click-app', appSlug);

  return url.toString();
}

export function useModelsQuery() {
  return useSuspenseQuery({
    refetchInterval: false,
    queryKey: ['listOneClickApps'],
    queryFn: fetchOneClickApps,
    select: (apps) => apps.filter((app) => app.category === 'Model').map(mapOneClickModel),
  });
}

function mapOneClickModel(app: ApiOneClickApp): AiModel {
  const definition = app.template_definition as { docker: { image: string } };

  return {
    name: app.name,
    slug: app.slug,
    description: app.description,
    logo: app.logos[0]!,
    dockerImage: definition.docker.image,
    minVRam: parseBytes(app.model_min_vram_gb + 'GB'),
    metadata: app.metadata ?? [],
    env: app.env?.map((env) => ({ name: env.name, value: String(env.default), regions: [] })),
  };
}

export function useModels() {
  const { data } = useModelsQuery();

  return sortBy(data, 'name');
}

export function useModel(slug?: string) {
  return useModels().find(hasProperty('slug', slug));
}
