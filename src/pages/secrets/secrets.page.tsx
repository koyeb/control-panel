import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useSecretsQuery } from 'src/api/hooks/secret';
import { DocumentTitle } from 'src/components/document-title';
import { Title } from 'src/components/title';
import { Translate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { SecretsList } from './components/secrets-list';

const T = Translate.prefix('pages.secrets');

export function SecretsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: secrets } = useSecretsQuery('simple');

  return (
    <div className="col gap-8">
      <DocumentTitle title="Secrets" />

      <Title
        title={<T id="title" />}
        end={
          <Button
            className={clsx(secrets && secrets.length === 0 && 'hidden')}
            onClick={() => setCreateDialogOpen(true)}
          >
            <T id="createSecret" />
          </Button>
        }
      />

      <SecretsList onCreate={() => setCreateDialogOpen(true)} />

      <CreateSecretDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
