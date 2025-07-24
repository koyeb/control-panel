import { token } from 'ditox';

import { ConfigPort } from './application/config';
import { StoragePort } from './application/storage';

export const TOKENS = {
  config: token<ConfigPort>(),
  storage: token<StoragePort>(),
};
