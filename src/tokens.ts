import { token } from 'ditox';

import { Api } from './api/api';
import { AuthenticationPort } from './application/authentication';
import { StoragePort } from './application/storage';
import { SeonPort } from './hooks/seon';

export const TOKENS = {
  storage: token<StoragePort>('storage'),
  authentication: token<AuthenticationPort>('authentication'),
  seon: token<SeonPort>('seon'),
  api: token<Api>('api'),
};
