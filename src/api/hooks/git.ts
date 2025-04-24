import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { isApiFailedPrecondition } from '../api-errors';
import { mapGithubApp, mapRepository } from '../mappers/git';
import { GitRepository } from '../model';
import { useApiQueryFn } from '../use-api';

import { useOrganizationUnsafe } from './session';

const isNotGithubAppError = (error: Error) => {
  return isApiFailedPrecondition(error) && error.message === 'No GitHub Installation';
};

export function useGithubAppQuery(refetchInterval?: number) {
  const organization = useOrganizationUnsafe();

  return useQuery({
    ...useApiQueryFn('getGithubApp'),
    enabled: organization !== undefined,
    refetchInterval,
    select: mapGithubApp,
    refetchOnWindowFocus: () => false,
    retry: (count, error) => (isNotGithubAppError(error) ? false : count < 3),
    throwOnError: (error) => !isNotGithubAppError(error),
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
