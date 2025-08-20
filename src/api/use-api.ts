import { InvalidateQueryFilters, QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';

import { Api } from './api';

type Endpoint = keyof Api;
type EndpointFn<E extends Endpoint> = (param: ApiEndpointParams<E>) => Promise<ApiEndpointResult<E>>;

type ApiEndpointParams<E extends Endpoint> = Parameters<Api[E]>[0];
type ApiEndpointResult<E extends Endpoint> = Awaited<ReturnType<Api[E]>>;

export function getQueryKey(endpoint: string, params: object): QueryKey {
  return [endpoint, params];
}

export function getApiQueryKey<E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E>) {
  return getQueryKey(endpoint, params);
}

export function useApiQueryFn<E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) {
  const api = container.resolve(TOKENS.api);
  const fn = api[endpoint] as EndpointFn<E>;

  return {
    queryKey: getApiQueryKey(endpoint, params ?? {}),
    queryFn: ({ signal }: { signal: AbortSignal }) => fn({ signal, ...params }),
  };
}

type ApiEndpointParamsFn<E extends Endpoint, Variables> = (
  variables: Variables,
) => ApiEndpointParams<E> | Promise<ApiEndpointParams<E>>;

export function useApiMutationFn<E extends Endpoint, Variables = void>(
  endpoint: E,
  options: ApiEndpointParams<E> | ApiEndpointParamsFn<E, Variables>,
) {
  const api = container.resolve(TOKENS.api);
  const fn = api[endpoint] as EndpointFn<E>;

  return {
    mutationFn: async (variables: Variables): Promise<ApiEndpointResult<E>> => {
      return fn(typeof options === 'function' ? await options(variables) : options);
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
