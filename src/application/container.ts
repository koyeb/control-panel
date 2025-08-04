import { createContainer, injectableClass } from 'ditox';

import { api } from 'src/api/api';
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
container.bindValue(TOKENS.api, api);

declare global {
  interface Window {
    config: () => ConfigPort;
    auth: () => AuthenticationPort;
    seon: () => SeonPort;
  }
}

window.config = () => container.resolve(TOKENS.config);
window.auth = () => container.resolve(TOKENS.authentication);
window.seon = () => container.resolve(TOKENS.seon);
