import Intercom from '@intercom/messenger-js-sdk';

import { api } from './api/api';
import { getConfig } from './application/config';
import { reportError } from './application/report-error';
import { getToken } from './application/token';

loadIntercom().catch(reportError);

async function loadIntercom() {
  const { intercomAppId } = getConfig();

  if (intercomAppId === undefined) {
    return;
  }

  const token = getToken();
  const userHash = token ? await api.getIntercomUserHash({ token }) : undefined;

  Intercom({ app_id: intercomAppId, user_hash: userHash?.hash });
}
