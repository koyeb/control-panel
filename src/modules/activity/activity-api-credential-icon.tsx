import { InfoTooltip } from '@koyeb/design-system';
import { useMemo } from 'react';
import { z } from 'zod';

import { useApiCredentialsQuery } from 'src/api';
import { createValidationGuard } from 'src/application/validation';
import { createTranslate } from 'src/intl/translate';
import { Activity, ApiCredential } from 'src/model';
import { hasProperty } from 'src/utils/object';

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
      iconClassName="text-dim"
    />
  );
}

function useApiCredential(activity: Activity): ApiCredential | undefined {
  const query = useApiCredentialsQuery();

  return useMemo(() => {
    const tokenId = isCredentialActivity(activity)
      ? activity.metadata.authTokenRef.replace(/^credential:/, '')
      : undefined;

    if (tokenId === undefined || !query.isSuccess) {
      return;
    }

    return query.data.find(hasProperty('id', tokenId));
  }, [activity, query]);
}

const isCredentialActivity = createValidationGuard(
  z.object({
    metadata: z.object({
      authTokenRef: z.string().startsWith('credential:'),
    }),
  }),
);
