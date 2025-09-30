import { createContainer, injectable, injectableClass } from 'ditox';

import { api } from 'src/api/api';
import { TOKENS } from 'src/tokens';
import { keys, toObject } from 'src/utils/object';
import { AnyFunction } from 'src/utils/types';

import { AuthenticationPort, StorageAuthenticationAdapter } from './authentication';
import { getConfig } from './config';

export const container = createContainer();

container.bindFactory(TOKENS.authentication, injectableClass(StorageAuthenticationAdapter));
container.bindFactory(TOKENS.api, injectable(createApi, TOKENS.authentication));

function createApi(auth: AuthenticationPort) {
  return toObject(
    keys(api),
    (key) => key,
    (key) => {
      return (param: object) => {
        const fn: AnyFunction = api[key];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return fn({
          baseUrl: getConfig('apiBaseUrl'),
          token: auth.token,
          ...param,
        });
      };
    },
  );
}

export const getApi = () => container.resolve(TOKENS.api);

declare global {
  interface Window {
    TOKENS: typeof TOKENS;
    container: typeof container;
  }
}

window.TOKENS = TOKENS;
window.container = container;
