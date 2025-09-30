import { ApiEndpoint, api } from 'src/api/api';

import { getConfig } from './config';
import { getToken } from './token';

export const getApi = () => {
  return <E extends ApiEndpoint>(...[endpoint, params, options]: Parameters<typeof api<E>>) => {
    return api(endpoint, params, {
      baseUrl: getConfig('apiBaseUrl'),
      token: getToken(),
      ...options,
    });
  };
};
