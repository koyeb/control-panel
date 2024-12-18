import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useSecretsQuery } from 'src/api/hooks/secret';
import { Secret } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { IconListPlus, IconPlus } from 'src/components/icons';
import { Title } from 'src/components/title';
import { useSet } from 'src/hooks/collection';
import { useHistoryState } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { BulkCreateSecretsDialog } from './components/bulk-create-secrets-dialog';
import { BulkDeleteSecretsDialog } from './components/bulk-delete-secret-dialog';
import { SecretsList } from './components/secrets-list';

const T = Translate.prefix('pages.secrets');

export function SecretsPage() {
  const historyState = useHistoryState<{ create: boolean }>();
  const [openDialog, setOpenDialog] = useState<'create' | 'bulkCreate' | 'bulkDelete' | undefined>(
    historyState.create ? 'create' : undefined,
  );

  const closeDialog = () => setOpenDialog(undefined);

  const { data: secrets } = useSecretsQuery('simple');

  const [selected, { toggle, clear }] = useSet<Secret>();

  return (
    <div className="col gap-8">
      <DocumentTitle title="Secrets" />

      <Title
        title={<T id="title" />}
        end={
          <div className="row items-center gap-2">
            {selected.size > 0 && (
              <Button variant="outline" onClick={() => setOpenDialog('bulkDelete')}>
                <T id="deleteSecrets" values={{ count: selected.size }} />
              </Button>
            )}

            <Button variant="outline" onClick={() => setOpenDialog('bulkCreate')}>
              <IconListPlus className="size-4" />
              <T id="importSecrets" />
            </Button>

            <Button
              className={clsx(secrets && secrets.length === 0 && 'hidden')}
              onClick={() => setOpenDialog('create')}
            >
              <IconPlus className="size-4" />
              <T id="createSecret" />
            </Button>
          </div>
        }
      />

      <SecretsList onCreate={() => setOpenDialog('create')} selected={selected} toggleSelected={toggle} />

      <BulkDeleteSecretsDialog
        open={openDialog === 'bulkDelete'}
        onClose={closeDialog}
        secrets={Array.from(selected.values())}
        onDeleted={() => {
          clear();
          closeDialog();
        }}
      />

      <BulkCreateSecretsDialog open={openDialog === 'bulkCreate'} onClose={closeDialog} />
      <CreateSecretDialog open={openDialog === 'create'} onClose={closeDialog} onCreated={closeDialog} />
    </div>
  );
}
