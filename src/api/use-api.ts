import { InvalidateQueryFilters, QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';

import { ApiEndpoint, ApiEndpointFn, ApiEndpointParams, ApiEndpointResult } from './api';

export function getApiQueryKey<E extends ApiEndpoint>(endpoint: E, params: ApiEndpointParams<E>) {
  return [endpoint, params] as const;
}

export function createEnsureApiQueryData(queryClient: QueryClient, abortController?: AbortController) {
  void abortController;

  return <E extends ApiEndpoint>(endpoint: E, params: ApiEndpointParams<E>) => {
    return queryClient.ensureQueryData({
      queryKey: getApiQueryKey(endpoint, params),
      queryFn: () => apiQueryFn(endpoint)({ ...params }),
    });
  };
}

export function useApiQueryFn<E extends ApiEndpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) {
  return {
    queryKey: getApiQueryKey(endpoint, params),
    queryFn: ({ signal }: { signal: AbortSignal }) => apiQueryFn(endpoint)({ signal, ...params }),
  };
}

function apiQueryFn<E extends ApiEndpoint>(endpoint: E) {
  return container.resolve(TOKENS.api)[endpoint] as ApiEndpointFn<E>;
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
