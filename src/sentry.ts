import * as Sentry from '@sentry/react';

import { ApiError } from './api/api-errors';
import { UnexpectedError } from './application/errors';
import { inArray } from './utils/arrays';
import { getConfig } from './utils/config';

async function initSentry() {
  const environment = getConfig('environment');

  if (environment === 'development') {
    return;
  }

  Sentry.init({
    dsn: 'https://72a8f873435143dbde30ac565779a50f@o4503964164554752.ingest.us.sentry.io/4507418130972672',
    integrations: [],
    environment,
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error instanceof TypeError && inArray(error.message, ['Failed to fetch', 'Load failed'])) {
        return null;
      }

      if (error instanceof ApiError && error.status < 500) {
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

// eslint-disable-next-line no-console
initSentry().catch(console.error);
