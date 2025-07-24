import Intercom from '@intercom/messenger-js-sdk';

import { api } from './api/api';
import { container } from './application/container';
import { reportError } from './application/report-error';
import { TOKENS } from './tokens';
import { getConfig } from './utils/config';

loadIntercom().catch(reportError);

async function loadIntercom() {
  const intercomAppId = getConfig('intercomAppId');

  if (intercomAppId === undefined) {
    return;
  }

  const token = container.resolve(TOKENS.authentication).token;
  const user = token ? await api.getCurrentUser({}) : undefined;
  const userHash = token ? await api.getIntercomUserHash({}) : undefined;

  Intercom({
    app_id: intercomAppId,
    user_id: user?.user?.id,
    user_hash: userHash?.hash,
  });
}
