import { token } from 'ditox';

import { ApiPort } from './api/api';
import { AuthenticationPort } from './application/authentication';
import { ConfigPort } from './application/config';
import { StoragePort } from './application/storage';
import { SeonPort } from './hooks/seon';

export const TOKENS = {
  config: token<ConfigPort>('config'),
  storage: token<StoragePort>('storage'),
  authentication: token<AuthenticationPort>('authentication'),
  seon: token<SeonPort>('seon'),
  api: token<ApiPort>('api'),
};
