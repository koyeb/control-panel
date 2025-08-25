import { InvalidateQueryFilters, QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';

import { Api, ApiEndpoint, ApiEndpointFn, ApiEndpointParams, ApiEndpointResult } from './api';

export function getQueryKey(endpoint: string, params: object): QueryKey {
  return [endpoint, params];
}

export function getApiQueryKey<E extends ApiEndpoint>(endpoint: E, params: ApiEndpointParams<E>) {
  return getQueryKey(endpoint, params);
}

export function useApiQueryFn<E extends ApiEndpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) {
  return {
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getApiQueryKey(endpoint, params),
    queryFn: ({ signal }: { signal: AbortSignal }) => {
      const api = container.resolve(TOKENS.api);
      const fn = api[endpoint] as ApiEndpointFn<E>;

      return fn({ signal, ...params });
    },
  };
}

type ApiEndpointParamsFn<E extends ApiEndpoint, Variables> = (
  variables: Variables,
) => ApiEndpointParams<E> | Promise<ApiEndpointParams<E>>;

export function useApiMutationFn<E extends ApiEndpoint, Variables = void>(
  endpoint: E,
  options: ApiEndpointParams<E> | ApiEndpointParamsFn<E, Variables>,
) {
  return {
    mutationFn: async (variables: Variables): Promise<ApiEndpointResult<E>> => {
      const api = container.resolve(TOKENS.api);
      const fn = api[endpoint] as ApiEndpointFn<E>;

      return fn(typeof options === 'function' ? await options(variables) : options);
    },
  };
}

export function useInvalidateApiQuery() {
  const queryClient = useQueryClient();

  return useCallback(
    <E extends ApiEndpoint>(
      endpoint: E,
      params: ApiEndpointParams<E> = {},
      filters: InvalidateQueryFilters = {},
    ) => {
      return queryClient.invalidateQueries({
        queryKey: getApiQueryKey(endpoint, params),
        ...filters,
      });
    },
    [queryClient],
  );
}

export function useEnsureApiQueryData() {
  const queryClient = useQueryClient();

  return useCallback(
    async <E extends keyof Api>(endpoint: E, params: Parameters<Api[E]>[0]) => {
      const api = container.resolve(TOKENS.api);
      const fn = api[endpoint] as ApiEndpointFn<E>;

      return queryClient.ensureQueryData({
        queryKey: getApiQueryKey(endpoint, params),
        queryFn: () => fn(params),
      });
    },
    [queryClient],
  );
}
