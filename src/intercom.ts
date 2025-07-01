import Intercom from '@intercom/messenger-js-sdk';

import { api } from './api/api';
import { getToken } from './application/authentication';
import { getConfig } from './application/config';
import { reportError } from './application/report-error';

loadIntercom().catch(reportError);

async function loadIntercom() {
  const { intercomAppId } = getConfig();

  if (intercomAppId === undefined) {
    return;
  }

  const token = getToken();
  const user = token ? await api.getCurrentUser({ token }) : undefined;
  const userHash = token ? await api.getIntercomUserHash({ token }) : undefined;

  Intercom({
    app_id: intercomAppId,
    user_id: user?.user?.id,
    user_hash: userHash?.hash,
  });
}
