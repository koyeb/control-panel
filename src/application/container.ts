import { createContainer, injectableClass } from 'ditox';

import { ApiEndpoint, api } from 'src/api/api';
import { TOKENS } from 'src/tokens';

import { StorageAuthenticationAdapter } from './authentication';
import { getConfig } from './config';
import { getToken } from './token';

export const container = createContainer();

container.bindFactory(TOKENS.authentication, injectableClass(StorageAuthenticationAdapter));

export const getApi = () => {
  return <E extends ApiEndpoint>(...[endpoint, params, options]: Parameters<typeof api<E>>) => {
    return api(endpoint, params, {
      baseUrl: getConfig('apiBaseUrl'),
      token: getToken(),
      ...options,
    });
  };
};

declare global {
  interface Window {
    TOKENS: typeof TOKENS;
    container: typeof container;
  }
}

window.TOKENS = TOKENS;
window.container = container;
