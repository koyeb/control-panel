import { token } from 'ditox';

import { Api } from './api/api';
import { AuthenticationPort } from './application/authentication';
import { SeonPort } from './hooks/seon';

export const TOKENS = {
  authentication: token<AuthenticationPort>('authentication'),
  seon: token<SeonPort>('seon'),
  api: token<Api>('api'),
};
