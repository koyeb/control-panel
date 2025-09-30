import { ApiEndpoint, api, apiStream } from 'src/api/api';

import { getConfig } from '../application/config';
import { getToken } from '../application/token';

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
export * from './hooks/invitation';
export * from './hooks/secret';
export * from './hooks/service';
export * from './hooks/session';
export * from './hooks/volume';

export * from './api-error';
export * from './api-types';
export * from './fixtures';
export * from './query';

export function getApi() {
  return <E extends ApiEndpoint>(...[endpoint, params, options]: Parameters<typeof api<E>>) => {
    return api(endpoint, params, {
      ...getApiOptions(),
      ...options,
    });
  };
}

export function getApiStream() {
  return <E extends ApiEndpoint>(...[endpoint, params, options]: Parameters<typeof apiStream<E>>) => {
    return apiStream(endpoint, params, {
      ...getApiOptions(),
      ...options,
    });
  };
}

function getApiOptions() {
  return {
    baseUrl: getConfig('apiBaseUrl'),
    token: getToken(),
  };
}
