import { token } from 'ditox';

import { Api } from './api/api';
import { AuthenticationPort } from './application/authentication';

export const TOKENS = {
  authentication: token<AuthenticationPort>('authentication'),
  api: token<Api>('api'),
};
