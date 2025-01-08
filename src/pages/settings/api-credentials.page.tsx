import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { Button } from '@koyeb/design-system';
import { mapApiCredential } from 'src/api/mappers/api-credential';
import { ApiCredentialType } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { ApiCredentials } from 'src/components/api-credentials/api-credentials';
import { Dialog } from 'src/components/dialog';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';
import { upperCase } from 'src/utils/strings';

export function BaseApiCredentialsPage({ type }: { type: ApiCredentialType }) {
  const T = createTranslate(`pages.${type}Settings.apiCredential`);
  const openDialog = Dialog.useOpen();

  const query = useQuery({
    ...useApiQueryFn('listApiCredentials', { query: { limit: '100', type: upperCase(type) } }),
    select: mapApiCredential,
  });

  const credentials = query.data;

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          <Button
            className={clsx({ hidden: query.isPending || credentials?.length === 0 })}
            onClick={() => openDialog('CreateApiCredential')}
          >
            <T id="createApiCredential" />
          </Button>
        }
      />

      <ApiCredentials type={type} loading={query.isPending} error={query.error} credentials={credentials} />
    </>
  );
}
