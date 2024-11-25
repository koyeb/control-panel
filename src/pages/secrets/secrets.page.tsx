import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useSecretsQuery } from 'src/api/hooks/secret';
import { DocumentTitle } from 'src/components/document-title';
import { IconListPlus, IconPlus } from 'src/components/icons';
import { Title } from 'src/components/title';
import { useHistoryState } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { BulkCreateSecretsDialog } from './components/bulk-create-secrets-dialog';
import { SecretsList } from './components/secrets-list';

const T = Translate.prefix('pages.secrets');

export function SecretsPage() {
  const historyState = useHistoryState<{ create: boolean }>();
  const [createDialogOpen, setCreateDialogOpen] = useState(Boolean(historyState.create));
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false);
  const { data: secrets } = useSecretsQuery('simple');

  return (
    <div className="col gap-8">
      <DocumentTitle title="Secrets" />

      <Title
        title={<T id="title" />}
        end={
          <div className="row items-center gap-2">
            <Button variant="outline" onClick={() => setBulkCreateDialogOpen(true)}>
              <IconListPlus className="size-4" />
              <T id="importSecrets" />
            </Button>

            <Button
              className={clsx(secrets && secrets.length === 0 && 'hidden')}
              onClick={() => setCreateDialogOpen(true)}
            >
              <IconPlus className="size-4" />
              <T id="createSecret" />
            </Button>
          </div>
        }
      />

      <SecretsList onCreate={() => setCreateDialogOpen(true)} />

      <CreateSecretDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => setCreateDialogOpen(false)}
      />

      <BulkCreateSecretsDialog open={bulkCreateDialogOpen} onClose={() => setBulkCreateDialogOpen(false)} />
    </div>
  );
}
