import { QueryClient, QueryKey, useQueryClient } from '@tanstack/react-query';
import { dequal } from 'dequal';
import { useCallback } from 'react';

import { getConfig } from 'src/application/config';

import { ApiEndpoint, ApiRequestParams, api } from './api';

type Meta = {
  [key: string]: unknown;
  getAccessToken?: () => Promise<string | null>;
};

export function getApiQueryKey<E extends ApiEndpoint>(
  endpoint: E,
  params: ApiRequestParams<E>,
): [E, ApiRequestParams<E>] {
  return [endpoint, params];
}

export function isApiQueryKey<E extends ApiEndpoint>(
  queryKey: QueryKey,
  endpoint?: E,
  params?: ApiRequestParams<E>,
): queryKey is [E, ApiRequestParams<E>] {
  return [
    queryKey.length === 2,
    endpoint === undefined || queryKey[0] === endpoint,
    params === undefined || dequal(queryKey[1], params),
  ].every(Boolean);
}

export function apiQuery<E extends ApiEndpoint>(endpoint: E, params: ApiRequestParams<E>) {
  return {
    queryKey: getApiQueryKey(endpoint, params),
    queryFn: async ({
      queryKey: [endpoint, params],
      signal,
      meta,
    }: {
      queryKey: readonly [E, ApiRequestParams<E>];
      signal: AbortSignal;
      meta?: Meta;
    }) => {
      return api(endpoint, params, {
        baseUrl: getConfig('apiBaseUrl'),
        token: await meta?.getAccessToken?.(),
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
    mutationFn: async (variables: Variables, { meta }: { meta?: Meta }) => {
      return api<E>(endpoint, typeof params === 'function' ? await params(variables) : params, {
        baseUrl: getConfig('apiBaseUrl'),
        token: await meta?.getAccessToken?.(),
        ...meta,
      });
    },
  };
}

export function useInvalidateApiQuery() {
  const queryClient = useQueryClient();

  return useCallback(
    <E extends ApiEndpoint>(endpoint: E, params?: Partial<ApiRequestParams<E>>) => {
      return queryClient.invalidateQueries({
        queryKey: [endpoint, ...(params ? [params] : [])],
        refetchType: 'all',
      });
    },
    [queryClient],
  );
}

export function createEnsureApiQueryData(queryClient: QueryClient) {
  return <E extends ApiEndpoint>(endpoint: E, params: ApiRequestParams<E>) => {
    return queryClient.ensureQueryData(apiQuery(endpoint, params));
  };
}
