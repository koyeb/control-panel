import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { StoredValue } from 'src/application/storage';
import { Project } from 'src/model';
import { assert } from 'src/utils/assert';
import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import { apiQuery } from '../query';

export function useProjectsQuery({ search, limit }: { search: string; limit: number }) {
  return useQuery({
    ...apiQuery('get /v1/projects', {
      query: {
        name: search || undefined,
        limit: limit ? String(limit) : undefined,
      },
    }),
    placeholderData: keepPreviousData,
    select: ({ projects }): Project[] => projects!.map((project) => snakeToCamelDeep(requiredDeep(project))),
  });
}

export function useProjects(...params: Parameters<typeof useProjectsQuery>) {
  return useProjectsQuery(...params).data ?? [];
}

export function useProjectQuery(projectId?: string) {
  return useQuery({
    ...apiQuery('get /v1/projects/{id}', { path: { id: projectId! } }),
    enabled: projectId !== undefined,
    select: ({ project }): Project => snakeToCamelDeep(requiredDeep(project!)),
  });
}

export function useProject(projectId?: string) {
  return useProjectQuery(projectId).data;
}

const storedCurrentProjectId = new StoredValue<string>('currentProjectId', {
  parse: String,
  stringify: String,
});

export const getCurrentProjectId = storedCurrentProjectId.read;
export const setCurrentProjectId = storedCurrentProjectId.write;

export function useCurrentProjectId(): [string, (projectId: string) => void] {
  const projectId = useSyncExternalStore(storedCurrentProjectId.listen, storedCurrentProjectId.read);

  assert(projectId !== null);

  return [projectId, storedCurrentProjectId.write];
}

export function useCurrentProjectQuery() {
  const [projectId] = useCurrentProjectId();

  return useQuery({
    ...apiQuery('get /v1/projects/{id}', {
      path: { id: projectId },
    }),
    select: ({ project }) => snakeToCamelDeep(requiredDeep(project)),
  });
}

export function useCurrentProject() {
  return useCurrentProjectQuery().data;
}
