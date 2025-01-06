import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useSecrets } from 'src/api/hooks/secret';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';

import { RegistrySecretList } from './components/registry-secret-list';

const T = createTranslate('pages.organizationSettings.registrySecrets');

export function RegistrySecretsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const secrets = useSecrets('registry');

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className={clsx(secrets?.length === 0 && 'hidden')}
          >
            <T id="createRegistrySecret" />
          </Button>
        }
      />

      <RegistrySecretList onCreate={() => setCreateDialogOpen(true)} />

      <CreateRegistrySecretDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => setCreateDialogOpen(false)}
      />
    </>
  );
}
