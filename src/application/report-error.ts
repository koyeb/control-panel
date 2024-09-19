import * as Sentry from '@sentry/react';

import { User } from 'src/api/model';

export function reportError(error: unknown, payload?: unknown) {
  Sentry.captureException(error, { contexts: { extra: { payload } } });
}

export async function identifyUserInSentry(user: User | null) {
  if (user) {
    Sentry.setUser({ id: user.id, username: user.name, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}
