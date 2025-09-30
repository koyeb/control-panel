import { wait } from 'src/utils/promises';
import { OmitBy, ValueOf } from 'src/utils/types';

import { ApiError } from './api-error';
import { paths } from './api.generated';

export type ApiEndpoint = Compute<
  ValueOf<{
    [Path in keyof paths]: ValueOf<{
      [Method in Exclude<keyof OmitBy<Required<paths[Path]>, never>, 'parameters'>]: `${Method} ${Path}`;
    }>;
  }>
>;

export type GetApiEndpoint<E extends ApiEndpoint> = E extends `${infer Method} ${infer Path}`
  ? paths extends { [P in Path]: { [M in Method]: infer Endpoint } }
    ? Endpoint
    : never
  : never;

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

export function apiStream<E extends ApiEndpoint>(
  endpoint: Extract<E, `get /v1/streams/${string}`>,
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

function buildUrl(
  path: string,
  params: Partial<Record<'path' | 'query', Partial<Record<string, unknown>>>>,
  baseUrl?: string,
) {
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

export type ApiRequestParams<E extends ApiEndpoint> =
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
  LiftOptional<OmitBy<P, undefined>> extends infer Output
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

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type Compute<T> = { [K in keyof T]: Compute<T[K]> } | never;

type AllOptional<T> = Partial<T> extends T ? true : false;

type LiftOptional<T> = Compute<
  {
    [K in keyof T as AllOptional<T[K]> extends true ? K : never]?: T[K];
  } & {
    [K in keyof T as AllOptional<T[K]> extends true ? never : K]: T[K];
  }
>;
