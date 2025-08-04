import { InvalidateQueryFilters, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';
import { keys, toObject } from 'src/utils/object';
import { AnyFunction } from 'src/utils/types';

import { Api } from './api';

type Endpoint = keyof Api;
type EndpointFn<E extends Endpoint> = (param: ApiEndpointParams<E>) => Promise<ApiEndpointResult<E>>;

type ApiEndpointParams<E extends Endpoint> = Parameters<Api[E]>[0];
type ApiEndpointResult<E extends Endpoint> = Awaited<ReturnType<Api[E]>>;

export function useApi() {
  return useMemo(() => {
    const auth = container.resolve(TOKENS.authentication);
    const config = container.resolve(TOKENS.config);
    const api = container.resolve(TOKENS.api);

    return toObject(
      keys(api),
      (key) => key,
      (key) => {
        return (param: object) => {
          const fn: AnyFunction = api[key];

          return fn({
            baseUrl: config.get('apiBaseUrl'),
            token: auth.token,
            ...param,
          }) as ReturnType<Api[Endpoint]>;
        };
      },
    ) as Api;
  }, []);
}

export function getApiQueryKey<E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E>) {
  return [endpoint, params];
}

export function useApiQueryFn<E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) {
  return {
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getApiQueryKey(endpoint, params),
    queryFn({ signal }: { signal: AbortSignal }): Promise<ApiEndpointResult<E>> {
      const config = container.resolve(TOKENS.config);
      const auth = container.resolve(TOKENS.authentication);
      const api = container.resolve(TOKENS.api);

      const fn = api[endpoint] as EndpointFn<E>;

      return fn({
        baseUrl: config.get('apiBaseUrl'),
        token: auth.token,
        signal,
        ...params,
      });
    },
  };
}

type ApiEndpointParamsFn<E extends Endpoint, Variables> = (
  variables: Variables,
) => ApiEndpointParams<E> | Promise<ApiEndpointParams<E>>;

export function useApiMutationFn<E extends Endpoint, Variables = void>(
  endpoint: E,
  options: ApiEndpointParams<E> | ApiEndpointParamsFn<E, Variables>,
) {
  return {
    async mutationFn(
      ...[variables]: Variables extends void ? [] : [Variables]
    ): Promise<ApiEndpointResult<E>> {
      const params = typeof options === 'function' ? await options(variables as Variables) : options;
      const config = container.resolve(TOKENS.config);
      const api = container.resolve(TOKENS.api);

      const auth = container.resolve(TOKENS.authentication);
      const fn = api[endpoint] as EndpointFn<E>;

      return fn({
        baseUrl: config.get('apiBaseUrl'),
        token: auth.token,
        ...params,
      });
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

  return useCallback(
    <E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) => {
      return queryClient.prefetchQuery({
        queryKey: getApiQueryKey(endpoint, params),
        queryFn() {
          const api = container.resolve(TOKENS.api);
          const fn = api[endpoint] as EndpointFn<E>;

          return fn(params);
        },
      });
    },
    [queryClient],
  );
}
