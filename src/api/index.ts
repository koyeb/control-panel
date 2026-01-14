import { useAuth } from '@workos-inc/authkit-react';
import { useCallback } from 'react';

import { ApiEndpoint, api, apiStream } from 'src/api/api';

import { getConfig } from '../application/config';

export * from './mappers/activity';
export * from './mappers/api-credential';
export * from './mappers/billing';
export * from './mappers/catalog';
export * from './mappers/deployment';
export * from './mappers/git';
export * from './mappers/secret';
export * from './mappers/service';
export * from './mappers/session';
export * from './mappers/volume';

export * from './hooks/api-credential';
export * from './hooks/app';
export * from './hooks/billing';
export * from './hooks/catalog';
export * from './hooks/domain';
export * from './hooks/git';
export * from './hooks/secret';
export * from './hooks/service';
export * from './hooks/session';
export * from './hooks/volume';

export * from './api-error';
export * from './api-types';
export * from './fixtures';
export * from './query';

export type ApiFn = typeof api;

export function getApi(getAccessToken: () => Promise<string>): ApiFn {
  return async (endpoint, params, options) => {
    return api(endpoint, params, {
      baseUrl: getConfig('apiBaseUrl'),
      token: await getAccessToken(),
      ...options,
    });
  };
}

export function useApi() {
  const { getAccessToken } = useAuth();

  return useCallback<ApiFn>(
    (...params) => {
      return getApi(getAccessToken)(...params);
    },
    [getAccessToken],
  );
}

export function getApiStream(token?: string | null) {
  return <E extends ApiEndpoint>(...[endpoint, params, options]: Parameters<typeof apiStream<E>>) => {
    return apiStream(endpoint, params, {
      baseUrl: getConfig('apiBaseUrl'),
      token,
      ...options,
    });
  };
}
