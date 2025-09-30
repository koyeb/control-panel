import { token } from 'ditox';

import { AuthenticationPort } from './application/authentication';

export const TOKENS = {
  authentication: token<AuthenticationPort>('authentication'),
};
