import { InvalidateQueryFilters, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useToken } from 'src/application/authentication';
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
  const token = useToken();

  return useMemo(() => {
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
            token,
            ...param,
          }) as ReturnType<Api[Endpoint]>;
        };
      },
    ) as Api;
  }, [token]);
}

export function getQueryKey(endpoint: string, params: object, token: string | null) {
  return [endpoint, params, token?.slice(-6)];
}

export function getApiQueryKey<E extends Endpoint>(
  endpoint: E,
  params: ApiEndpointParams<E>,
  token: string | null,
) {
  return getQueryKey(endpoint, params, token);
}

export function useApiQueryFn<E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) {
  const token = useToken();

  return {
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getApiQueryKey(endpoint, params, token),
    queryFn({ signal }: { signal: AbortSignal }): Promise<ApiEndpointResult<E>> {
      const config = container.resolve(TOKENS.config);
      const api = container.resolve(TOKENS.api);

      const fn = api[endpoint] as EndpointFn<E>;

      return fn({
        baseUrl: config.get('apiBaseUrl'),
        token,
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
  const token = useToken();

  return {
    async mutationFn(
      ...[variables]: Variables extends void ? [] : [Variables]
    ): Promise<ApiEndpointResult<E>> {
      const params = typeof options === 'function' ? await options(variables as Variables) : options;
      const config = container.resolve(TOKENS.config);
      const api = container.resolve(TOKENS.api);

      const fn = api[endpoint] as EndpointFn<E>;

      return fn({
        baseUrl: config.get('apiBaseUrl'),
        token,
        ...params,
      });
    },
  };
}

export function useInvalidateApiQuery() {
  const queryClient = useQueryClient();
  const token = useToken();

  return useCallback(
    <E extends Endpoint>(
      endpoint: E,
      params: ApiEndpointParams<E> = {},
      filters: InvalidateQueryFilters = {},
    ) => {
      return queryClient.invalidateQueries({
        queryKey: getApiQueryKey(endpoint, params, token),
        ...filters,
      });
    },
    [queryClient, token],
  );
}

export function usePrefetchApiQuery() {
  const queryClient = useQueryClient();
  const token = useToken();

  return useCallback(
    <E extends Endpoint>(endpoint: E, params: ApiEndpointParams<E> = {}) => {
      return queryClient.prefetchQuery({
        queryKey: getApiQueryKey(endpoint, params, token),
        queryFn() {
          const api = container.resolve(TOKENS.api);
          const fn = api[endpoint] as EndpointFn<E>;

          return fn(params);
        },
      });
    },
    [queryClient, token],
  );
}
