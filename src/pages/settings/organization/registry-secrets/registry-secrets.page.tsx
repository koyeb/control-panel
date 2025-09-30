import { Button } from '@koyeb/design-system';
import clsx from 'clsx';

import { useSecrets } from 'src/api';
import { Dialog } from 'src/components/dialog';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';

import { RegistrySecretList } from './components/registry-secret-list';

const T = createTranslate('pages.organizationSettings.registrySecrets');

export function RegistrySecretsPage() {
  const openDialog = Dialog.useOpen();
  const secrets = useSecrets('registry');

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          <Button
            onClick={() => openDialog('CreateRegistrySecret')}
            className={clsx(secrets?.length === 0 && '!hidden')}
          >
            <T id="createRegistrySecret" />
          </Button>
        }
      />

      <RegistrySecretList onCreate={() => openDialog('CreateRegistrySecret')} />

      <CreateRegistrySecretDialog />
    </>
  );
}
