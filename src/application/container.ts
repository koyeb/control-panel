import { createContainer, injectable, injectableClass } from 'ditox';

import { ApiPort } from 'src/api/api';
import { createApi } from 'src/api/create-api';
import { SeonAdapter, SeonPort } from 'src/hooks/seon';
import { TOKENS } from 'src/tokens';

import { AuthenticationPort, StorageAuthenticationAdapter } from './authentication';
import { ConfigPort, EnvConfigAdapter } from './config';
import { BrowserStorageAdapter } from './storage';

export const container = createContainer();

container.bindFactory(TOKENS.config, injectableClass(EnvConfigAdapter));
container.bindFactory(TOKENS.storage, injectableClass(BrowserStorageAdapter));
container.bindFactory(TOKENS.authentication, injectableClass(StorageAuthenticationAdapter, TOKENS.storage));
container.bindFactory(TOKENS.seon, injectableClass(SeonAdapter));

container.bindFactory(
  TOKENS.api,
  injectable(
    (config, auth) => {
      return createApi({
        baseUrl: config.get('apiBaseUrl'),
        getToken: () => auth.token,
      });
    },
    TOKENS.config,
    TOKENS.authentication,
  ),
);

declare global {
  interface Window {
    config: () => ConfigPort;
    auth: () => AuthenticationPort;
    seon: () => SeonPort;
    api: () => ApiPort;
  }
}

window.config = () => container.resolve(TOKENS.config);
window.auth = () => container.resolve(TOKENS.authentication);
window.seon = () => container.resolve(TOKENS.seon);
window.api = () => container.resolve(TOKENS.api);
