import Intercom from '@intercom/messenger-js-sdk';

import { api } from './api/api';
import { getToken } from './application/authentication';
import { reportError } from './application/report-error';
import { getConfig } from './utils/config';

loadIntercom().catch(reportError);

async function loadIntercom() {
  const intercomAppId = getConfig('intercomAppId');

  if (intercomAppId === undefined) {
    return;
  }

  const token = getToken();
  const user = token ? await api.getCurrentUser({}) : undefined;
  const userHash = token ? await api.getIntercomUserHash({}) : undefined;

  Intercom({
    app_id: intercomAppId,
    user_id: user?.user?.id,
    user_hash: userHash?.hash,
  });
}
