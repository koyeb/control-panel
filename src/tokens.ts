import { token } from 'ditox';

import { ApiPort } from './api/api';
import { AuthenticationPort } from './application/authentication';
import { ConfigPort } from './application/config';
import { StoragePort } from './application/storage';

export const TOKENS = {
  config: token<ConfigPort>('config'),
  storage: token<StoragePort>('storage'),
  authentication: token<AuthenticationPort>('authentication'),
  api: token<ApiPort>('api'),
};
