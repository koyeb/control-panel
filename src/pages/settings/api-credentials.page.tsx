import clsx from 'clsx';

import { Button } from '@koyeb/design-system';
import { useApiCredentialsQuery } from 'src/api/hooks/api-credential';
import { ApiCredentialType } from 'src/api/model';
import { ApiCredentials } from 'src/components/api-credentials/api-credentials';
import { Dialog } from 'src/components/dialog';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';

export function BaseApiCredentialsPage({ type }: { type: ApiCredentialType }) {
  const T = createTranslate(`pages.${type}Settings.apiCredential`);
  const query = useApiCredentialsQuery(type);
  const openDialog = Dialog.useOpen();

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          <Button
            className={clsx({ hidden: query.isPending || query.data?.length === 0 })}
            onClick={() => openDialog('CreateApiCredential')}
          >
            <T id="createApiCredential" />
          </Button>
        }
      />

      <ApiCredentials type={type} loading={query.isPending} error={query.error} credentials={query.data} />
    </>
  );
}
