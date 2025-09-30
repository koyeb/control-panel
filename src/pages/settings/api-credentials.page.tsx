import { Button } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { apiQuery, mapApiCredential } from 'src/api';
import { ApiCredentials } from 'src/components/api-credentials/api-credentials';
import { Dialog } from 'src/components/dialog';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';
import { ApiCredentialType } from 'src/model';
import { upperCase } from 'src/utils/strings';

export function BaseApiCredentialsPage({ type }: { type: ApiCredentialType }) {
  const T = createTranslate(`pages.${type}Settings.apiCredential`);
  const openDialog = Dialog.useOpen();

  const query = useQuery({
    ...apiQuery('get /v1/credentials', { query: { limit: '100', type: upperCase(type) } }),
    select: ({ credentials }) => credentials!.map(mapApiCredential),
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
