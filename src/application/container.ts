import { createContainer, injectable, injectableClass } from 'ditox';

import { api } from 'src/api/api';
import { SeonAdapter } from 'src/hooks/seon';
import { TOKENS } from 'src/tokens';
import { keys, toObject } from 'src/utils/object';
import { AnyFunction } from 'src/utils/types';

import { AuthenticationPort, StorageAuthenticationAdapter } from './authentication';
import { ConfigPort, EnvConfigAdapter } from './config';
import { BrowserStorageAdapter } from './storage';

export const container = createContainer();

container.bindFactory(TOKENS.config, injectableClass(EnvConfigAdapter));
container.bindFactory(TOKENS.storage, injectableClass(BrowserStorageAdapter));
container.bindFactory(TOKENS.authentication, injectableClass(StorageAuthenticationAdapter, TOKENS.storage));
container.bindFactory(TOKENS.seon, injectableClass(SeonAdapter));
container.bindFactory(TOKENS.api, injectable(createApi, TOKENS.config, TOKENS.authentication));

function createApi(config: ConfigPort, auth: AuthenticationPort) {
  return toObject(
    keys(api),
    (key) => key,
    (key) => {
      return (param: object) => {
        const fn: AnyFunction = api[key];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return fn({
          baseUrl: config.get('apiBaseUrl'),
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
