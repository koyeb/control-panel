import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getConfig } from 'src/application/config';
import { getToken } from 'src/application/token';
import { wait } from 'src/utils/promises';
import { OmitBy, ValueOf } from 'src/utils/types';

import { ApiError } from './api-errors';
import { paths } from './api.generated';

export { type API } from './api-types';

export type ApiEndpoint = ValueOf<{
  [Path in keyof paths]: ValueOf<{
    [Method in Exclude<keyof OmitBy<Required<paths[Path]>, never>, 'parameters'>]: `${Method} ${Path}`;
  }>;
}>;

export type GetApiEndpoint<E extends ApiEndpoint> = E extends `${infer Method} ${infer Path}`
  ? paths extends { [P in Path]: { [M in Method]: infer Endpoint } }
    ? Endpoint
    : never
  : never;

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

export function apiMutation<E extends ApiEndpoint, Variables = void>(
  endpoint: E,
  params:
    | ApiRequestParams<E>
    | ((variables: Variables) => ApiRequestParams<E> | Promise<ApiRequestParams<E>>),
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

export function createEnsureApiQueryData(queryClient: QueryClient, abortController?: AbortController) {
  void abortController;

  return <E extends ApiEndpoint>(endpoint: E, params: ApiRequestParams<E>) => {
    return queryClient.ensureQueryData(apiQuery(endpoint, params));
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

type ApiRequestOptions = Partial<{
  baseUrl: string;
  token: string | null;
  delay: number;
  signal: AbortSignal;
}>;

export async function api<E extends ApiEndpoint>(
  endpoint: E,
  params: ApiRequestParams<E>,
  { baseUrl, token, delay, signal }: ApiRequestOptions = {},
): Promise<ApiResponseBody<E>> {
  const [method, path] = endpoint.split(' ') as [string, string];
  const url = buildUrl(path, params, baseUrl);
  const headers = new Headers();

  const init: RequestInit = {
    method: method.toUpperCase(),
    headers,
    signal,
  };

  if ('header' in params) {
    for (const [name, value] of Object.entries(params.header)) {
      headers.set(name, String(value));
    }
  }

  if ('body' in params) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(params.body);
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (delay !== undefined) {
    await wait(delay, signal);
  }

  const response = await fetch(url, init);

  const responseBody: unknown = response.headers.get('Content-Type')?.startsWith('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(response, responseBody);
  }

  return responseBody as ApiResponseBody<E>;
}

export function apiStream<E extends Extract<ApiEndpoint, `get /v1/streams/${string}`>>(
  endpoint: E,
  params: ApiRequestParams<E>,
  { baseUrl, token }: { baseUrl?: string; token?: string | null } = {},
): WebSocket {
  const [, path] = endpoint.split(' ') as [string, string];
  const url = buildUrl(path, params, baseUrl);
  const protocols: string[] = [];

  if (token) {
    protocols.push('Bearer', token);
  }

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  return new WebSocket(url, protocols);
}

function buildUrl<E extends ApiEndpoint>(path: string, params: ApiRequestParams<E>, baseUrl?: string) {
  const url = new URL(path, baseUrl ?? window.location.origin);

  for (const [key, value] of Object.entries(params.path ?? {})) {
    url.pathname = url.pathname.replaceAll(encodeURIComponent(`{${key}}`), String(value));
  }

  for (const [key, value] of Object.entries(params.query ?? {})) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((value) => url.searchParams.append(key, String(value)));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

type ApiRequestParams<E extends ApiEndpoint> =
  GetApiEndpoint<E> extends {
    parameters: {
      path?: infer Path extends Record<string, string> | undefined;
      query?: infer Query extends Record<string, unknown> | undefined;
      header?: infer Header extends Record<string, string> | undefined;
    };
  }
    ? ProcessApiParams<{ path: Path; query: Query; header: Header; body: ApiRequestBody<E> }>
    : never;

type ProcessApiParams<P> =
  LiftOptional<OmitBy<P, undefined | never>> extends infer Output
    ? keyof Output extends never
      ? Record<string, never>
      : Output
    : never;

type ApiRequestBody<E extends ApiEndpoint> =
  GetApiEndpoint<E> extends {
    requestBody: { content: { '*/*': infer Body } };
  }
    ? Body extends Record<string, never>
      ? never
      : Body
    : never;

type ApiResponseBody<E extends ApiEndpoint> =
  GetApiEndpoint<E> extends {
    responses: { 200: { content: { '*/*': infer Result } } };
  }
    ? Result
    : never;

type Compute<T> = { [K in keyof T]: Compute<T[K]> } | never;

type AllOptional<T> = Partial<T> extends T ? true : false;

type LiftOptional<T> = Compute<
  {
    [K in keyof T as AllOptional<T[K]> extends true ? K : never]?: T[K];
  } & {
    [K in keyof T as AllOptional<T[K]> extends true ? never : K]: T[K];
  }
>;
