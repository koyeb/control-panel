import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getApi } from 'src/api';
import { GitRepository } from 'src/model';

import { ApiError } from '../api-error';
import { mapGithubApp, mapRepository } from '../mappers/git';
import { apiQuery, getApiQueryKey } from '../query';

import { useOrganizationUnsafe } from './session';

const isNoGithubAppError = (error: unknown) => {
  return ApiError.is(error, 400) && error.message === 'No GitHub Installation';
};

export function useGithubAppQuery(refetchInterval = 5000) {
  const organization = useOrganizationUnsafe();

  return useQuery({
    queryKey: getApiQueryKey('get /v1/github/installation', {}),
    queryFn: async ({ signal }) => {
      const api = getApi();

      return api('get /v1/github/installation', {}, { signal }).catch((error) => {
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
    ...apiQuery('get /v1/git/repositories', {
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
