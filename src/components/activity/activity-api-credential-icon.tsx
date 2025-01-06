import { useMemo } from 'react';

import { InfoTooltip } from '@koyeb/design-system';
import { useApiCredentialsQuery } from 'src/api/hooks/api-credential';
import { Activity, ApiCredential } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('activity');

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
    if (activity.tokenId === undefined || !query.isSuccess) {
      return;
    }

    return query.data.find(hasProperty('id', activity.tokenId));
  }, [activity, query]);
}
