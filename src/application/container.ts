import { createContainer, injectableClass } from 'ditox';

import { TOKENS } from 'src/tokens';

import { EnvConfigAdapter } from './config';

export const container = createContainer();

container.bindFactory(TOKENS.config, injectableClass(EnvConfigAdapter));
