import * as Sentry from '@sentry/react';

import { ApiError } from 'src/api/api-errors';
import { User } from 'src/api/model';

import { getConfig } from './config';
import { UnexpectedError } from './errors';

export function initSentry() {
  Sentry.init({
    dsn: getConfig('sentryDsn'),
    environment: getConfig('environment'),
    sendDefaultPii: true,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    ignoreErrors: ['Failed to fetch', 'Load failed', 'NetworkError when attempting to fetch resource'],
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (ApiError.is(error) && error.status < 500) {
        return null;
      }

      event.contexts ??= {};

      if (error instanceof UnexpectedError) {
        event.contexts.details = error.details;
      }

      return event;
    },
  });
}

export function reportError(error: unknown, payload?: unknown) {
  Sentry.captureException(error, { contexts: { extra: { payload } } });
}

export function identifyUserInSentry(user: User | null) {
  if (user) {
    Sentry.setUser({ id: user.id, username: user.name, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}
