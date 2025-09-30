import Intercom, { boot, shutdown } from '@intercom/messenger-js-sdk';

import { User } from 'src/api/model';

import { getConfig } from './config';
import { getApi } from './container';

export function initIntercom() {
  const appId = getConfig('intercomAppId');

  if (appId) {
    Intercom({ app_id: appId });
  }
}

export async function identifyUserInIntercom(user: User | null) {
  const appId = getConfig('intercomAppId');

  if (!appId) {
    return;
  }

  if (user) {
    boot({
      app_id: appId,
      user_id: user.id,
      user_hash: await getUserHash(),
    });
  } else {
    shutdown();
  }
}

async function getUserHash() {
  const api = getApi();

  return api('get /v1/intercom/profile', {}).then(({ hash }) => hash);
}
