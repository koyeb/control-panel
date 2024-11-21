import { useQuery } from '@tanstack/react-query';
import sortBy from 'lodash-es/sortBy';

import { getConfig } from 'src/application/config';
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
  name: string;
  logos: [string, ...string[]];
  description: string;
  repository: string;
  deploy_button_url: string;
  slug: string;
};

export function useOneClickAppsQuery() {
  return useQuery({
    queryKey: ['listOneClickApps'],
    async queryFn() {
      const { websiteUrl } = getConfig();
      const response = await fetch(`${websiteUrl}/api/get-one-click-apps`, { mode: 'cors' });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as OneClickAppApiResponse[];
    },
    select: (apps) => {
      return apps.map((app) => ({
        name: app.name,
        slug: app.slug,
        description: app.description,
        logo: app.logos[0],
        repository: app.repository,
        deployUrl: getOneClickAppUrl(app.slug, app.deploy_button_url),
      }));
    },
  });
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
    queryKey: ['getModels'],
    queryFn() {
      return models;
    },
  });
}

export function useModels() {
  const { data } = useModelsQuery();

  return sortBy(data, 'name');
}

export function useModel(name?: string) {
  return useModels().find(hasProperty('name', name));
}

const models: AiModel[] = [
  {
    name: 'meta-llama/Llama-3.1-8B',
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes (text in/text out).',
    dockerImage: 'koyeb/meta-llama-3.1-8b:latest',
    engine: 'vLLM',
    parameters: '8.03B',
    min_vram: 30019707136,
  },
  {
    name: 'NousResearch/Hermes-3-Llama-3.1-8B',
    description: 'Hermes 3 is the latest version of our flagship Hermes series of LLMs by Nous Research.',
    dockerImage: 'koyeb/nousresearch-hermes-3-llama-3.1-8b:latest',
    engine: 'vLLM',
    parameters: '8.03B',
    min_vram: 30019707136,
  },
  {
    name: 'mistralai/Mistral-7B-Instruct-v0.3',
    description:
      'The Mistral-7B-Instruct-v0.3 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.3.',
    dockerImage: 'koyeb/mistralai-mistral-7b-instruct-v0.3:latest',
    engine: 'vLLM',
    parameters: '7.25B',
    min_vram: 30019707136,
  },
  {
    name: 'google/gemma-2-9b-it',
    description: 'Summary description and brief definition of inputs and outputs.',
    dockerImage: 'koyeb/google-gemma-2-9b-it:latest',
    engine: 'vLLM',
    parameters: '9.24B',
    min_vram: 30019707136,
  },
  {
    name: 'Qwen/Qwen2.5-7B-Instruct',
    description: 'Qwen2.5 is the latest series of Qwen large language models.',
    dockerImage: 'koyeb/qwen-qwen2.5-7b-instruct:latest',
    engine: 'vLLM',
    parameters: '7.62B',
    min_vram: 30019707136,
  },
];
