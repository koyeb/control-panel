import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useToken } from 'src/application/authentication';

import { ApiError } from '../api-errors';
import { mapGithubApp, mapRepository } from '../mappers/git';
import { GitRepository } from '../model';
import { getApiQueryKey, useApi, useApiQueryFn } from '../use-api';

import { useOrganizationUnsafe } from './session';

export const isNoGithubAppError = (error: unknown) => {
  return ApiError.is(error, 400) && error.message === 'No GitHub Installation';
};

export function useGithubAppQuery(refetchInterval = 5000) {
  const organization = useOrganizationUnsafe();
  const api = useApi();
  const token = useToken();

  return useQuery({
    queryKey: getApiQueryKey('getGithubApp', {}, token),
    queryFn: async ({ signal }) => {
      return api.getGithubApp({ signal }).catch((error) => {
        if (isNoGithubAppError(error)) {
          return null;
        } else {
          throw error;
        }
      });
    },
    enabled: organization !== undefined,
    refetchInterval,
    select: (result) => (result ? mapGithubApp(result) : null),
  });
}

export function useGithubApp(refetchInterval?: number) {
  return useGithubAppQuery(refetchInterval).data;
}

export function useRepositoriesQuery(search: string) {
  return useQuery({
    ...useApiQueryFn('listRepositories', {
      query: {
        limit: '5',
        name: search || undefined,
      },
    }),
    placeholderData: keepPreviousData,
    select: ({ repositories }) => repositories!.map(mapRepository),
  });
}

const emptyArray: GitRepository[] = [];

export function useRepositories(search: string) {
  return useRepositoriesQuery(search).data ?? emptyArray;
}
