import Intercom, { boot, shutdown } from '@intercom/messenger-js-sdk';

import { api } from 'src/api/api';
import { User } from 'src/api/model';

import { TOKENS } from '../tokens';

import { getConfig } from './config';
import { container } from './container';

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
  const token = container.resolve(TOKENS.authentication).token;
  const baseUrl = getConfig('apiBaseUrl');

  return api.getIntercomUserHash({ baseUrl, token }).then(({ hash }) => hash);
}
