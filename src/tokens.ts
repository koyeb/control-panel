import { useAuth } from '@workos-inc/authkit-react';
import { token } from 'ditox';

import { Api } from './api/api';
import { AuthenticationPort } from './application/authentication';
import { ConfigPort } from './application/config';
import { StoragePort } from './application/storage';
import { SeonPort } from './hooks/seon';

type WorkOsContext = ReturnType<typeof useAuth>;

export const TOKENS = {
  config: token<ConfigPort>('config'),
  storage: token<StoragePort>('storage'),
  authentication: token<AuthenticationPort>('authentication'),
  workOs: token<WorkOsContext>('workOs'),
  seon: token<SeonPort>('seon'),
  api: token<Api>('api'),
};
