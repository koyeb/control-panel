import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getConfig } from 'src/application/config';
import { getToken } from 'src/application/token';

import { ApiEndpoint, ApiRequestParams, api } from './api';

export function getApiQueryKey<E extends ApiEndpoint>(
  endpoint: E,
  params: ApiRequestParams<E>,
): [E, ApiRequestParams<E>] {
  return [endpoint, params];
}

export function apiQuery<E extends ApiEndpoint>(endpoint: E, params: ApiRequestParams<E>) {
  return {
    queryKey: getApiQueryKey(endpoint, params),
    queryFn: ({
      queryKey: [endpoint, params],
      signal,
      meta,
    }: {
      queryKey: readonly [E, ApiRequestParams<E>];
      signal: AbortSignal;
      meta?: Record<string, unknown>;
    }) => {
      return api(endpoint, params, {
        baseUrl: getConfig('apiBaseUrl'),
        token: getToken(),
        signal,
        ...meta,
      });
    },
  };
}

type GetApiRequestParams<E extends ApiEndpoint, Variables> = (
  variables: Variables,
) => ApiRequestParams<E> | Promise<ApiRequestParams<E>>;

export function apiMutation<E extends ApiEndpoint, Variables = void>(
  endpoint: E,
  params: ApiRequestParams<E> | GetApiRequestParams<E, Variables>,
) {
  return {
    mutationKey: [endpoint, typeof params === 'object' ? params : null] as const,
    mutationFn: async (variables: Variables, { meta }: { meta?: Record<string, unknown> }) => {
      return api<E>(endpoint, typeof params === 'function' ? await params(variables) : params, {
        baseUrl: getConfig('apiBaseUrl'),
        token: getToken(),
        ...meta,
      });
    },
  };
}

export function useInvalidateApiQuery() {
  const queryClient = useQueryClient();

  return useCallback(
    <E extends ApiEndpoint>(endpoint: E, params?: Partial<ApiRequestParams<E>>) => {
      return queryClient.invalidateQueries({ queryKey: [endpoint, ...(params ? [params] : [])] });
    },
    [queryClient],
  );
}

export function createEnsureApiQueryData(queryClient: QueryClient, abortController?: AbortController) {
  void abortController;

  return <E extends ApiEndpoint>(endpoint: E, params: ApiRequestParams<E>) => {
    return queryClient.ensureQueryData(apiQuery(endpoint, params));
  };
}
