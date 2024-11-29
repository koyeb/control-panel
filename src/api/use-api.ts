import { InvalidateQueryFilters, QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useToken } from 'src/application/token';

import { api, ApiEndpointParams, ApiEndpointResult } from './api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...params: any[]) => any;

type Endpoint = keyof typeof api;

type UseApiQueryResult<E extends Endpoint> = {
  queryKey: QueryKey;
  queryFn: () => Promise<ApiEndpointResult<E>>;
};

export function useApiQueryFn<E extends Endpoint>(
  endpoint: E,
  params: ApiEndpointParams<E> = {},
): UseApiQueryResult<E> {
  const { token } = useToken();

  return {
    queryKey: [endpoint, params, token],
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
  const { token } = useToken();

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
  const { token } = useToken();

  return useCallback(
    <E extends Endpoint>(
      endpoint: E,
      params: ApiEndpointParams<E> = {},
      filters: InvalidateQueryFilters = {},
    ) => {
      return queryClient.invalidateQueries({ queryKey: [endpoint, params, token], ...filters });
    },
    [queryClient, token],
  );
}
