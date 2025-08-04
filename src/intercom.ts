import Intercom from '@intercom/messenger-js-sdk';

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
  const baseUrl = container.resolve(TOKENS.config).get('apiBaseUrl');
  const api = container.resolve(TOKENS.api);

  const user = token ? await api.getCurrentUser({ baseUrl, token }) : undefined;
  const userHash = token ? await api.getIntercomUserHash({ baseUrl, token }) : undefined;

  Intercom({
    app_id: intercomAppId,
    user_id: user?.user?.id,
    user_hash: userHash?.hash,
  });
}
