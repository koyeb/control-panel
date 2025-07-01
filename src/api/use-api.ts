import { InvalidateQueryFilters, QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from 'src/application/authentication';

import { ApiEndpointParams, ApiEndpointResult, api } from './api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...params: any[]) => any;

type Endpoint = keyof typeof api;

export function getApiQueryKey<E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E>) {
  return [endpoint, params];
}

type UseApiQueryResult<E extends Endpoint> = {
  queryKey: QueryKey;
  queryFn: () => Promise<ApiEndpointResult<E>>;
};

export function useApiQueryFn<E extends Endpoint>(
  endpoint: E,
  params: ApiEndpointParams<E> = {},
): UseApiQueryResult<E> {
  const { token } = useAuth();

  return {
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getApiQueryKey(endpoint, params),
    queryFn() {
      const fn = api[endpoint] as AnyFunction;

      return fn({
        token,
        ...params,
      }) as Promise<ApiEndpointResult<E>>;
    },
  };
}

type ApiEndpointParamsFn<E extends Endpoint, Variables> = (
  variables: Variables,
) => ApiEndpointParams<E> | Promise<ApiEndpointParams<E>>;

type UseApiMutationResult<E extends Endpoint, Variables> = {
  mutationFn: (param: Variables) => Promise<ApiEndpointResult<E>>;
};

export function useApiMutationFn<E extends Endpoint>(
  endpoint: E,
  params: ApiEndpointParams<E>,
): UseApiMutationResult<E, void>;

export function useApiMutationFn<E extends Endpoint, Variables>(
  endpoint: E,
  options: ApiEndpointParamsFn<E, Variables>,
): UseApiMutationResult<E, Variables>;

export function useApiMutationFn<E extends Endpoint, Variables>(
  endpoint: E,
  options: ApiEndpointParams<E> | ApiEndpointParamsFn<E, Variables>,
): UseApiMutationResult<E, Variables> {
  const { token } = useAuth();

  return {
    async mutationFn(param) {
      const opts = typeof options === 'function' ? await options(param) : options;
      const fn = api[endpoint] as AnyFunction;

      return fn({
        token,
        ...opts,
      }) as Promise<ApiEndpointResult<E>>;
    },
  };
}

export function useInvalidateApiQuery() {
  const queryClient = useQueryClient();

  return useCallback(
    <E extends Endpoint>(
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

export function usePrefetchApiQuery() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useCallback(
    <E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) => {
      return queryClient.prefetchQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: getApiQueryKey(endpoint, params),
        queryFn() {
          const fn = api[endpoint] as AnyFunction;

          return fn({
            token,
            ...params,
          }) as Promise<ApiEndpointResult<E>>;
        },
      });
    },
    [queryClient, token],
  );
}
