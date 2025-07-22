import { token } from 'ditox';

import { ConfigPort } from './application/config';

export const TOKENS = {
  config: token<ConfigPort>(),
};
