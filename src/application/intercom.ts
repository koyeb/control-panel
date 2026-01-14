import Intercom, { boot, shutdown } from '@intercom/messenger-js-sdk';

import { ApiFn } from 'src/api';
import { User } from 'src/model';

import { getConfig } from './config';

export function initIntercom() {
  const appId = getConfig('intercomAppId');

  if (appId) {
    Intercom({ app_id: appId });
  }
}

export async function identifyUserInIntercom(api: ApiFn, user: User | null) {
  const appId = getConfig('intercomAppId');

  if (!appId) {
    return;
  }

  if (user) {
    const { hash } = await api('get /v1/intercom/profile', {});

    boot({
      app_id: appId,
      user_id: user.id,
      user_hash: hash,
    });
  } else {
    shutdown();
  }
}
