import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiQuery, mapApiCredential } from 'src/api';
import { createValidationGuard } from 'src/application/validation';
import { InfoTooltip } from 'src/components/tooltip';
import { createTranslate } from 'src/intl/translate';
import { Activity, ApiCredential } from 'src/model';

const T = createTranslate('components.activity');

export function ActivityApiCredentialIcon({ activity }: { activity: Activity }) {
  const apiCredential = useApiCredential(activity);

  if (apiCredential === undefined) {
    return null;
  }

  return (
    <InfoTooltip
      content={
        <T
          id="tokenInfo"
          values={{ credentialType: apiCredential.type, credentialName: apiCredential.name }}
        />
      }
    />
  );
}

function useApiCredential(activity: Activity): ApiCredential | undefined {
  const credentialId = isCredentialActivity(activity)
    ? activity.metadata.authTokenRef.replace(/^credential:/, '')
    : undefined;

  const query = useQuery({
    ...apiQuery('get /v1/credentials/{id}', { path: { id: credentialId! } }),
    enabled: credentialId !== undefined,
    select: ({ credential }) => mapApiCredential(credential!),
  });

  return query.data;
}

const isCredentialActivity = createValidationGuard(
  z.object({
    metadata: z.object({
      authTokenRef: z.string().startsWith('credential:'),
    }),
  }),
);
