import clsx from 'clsx';

import { Button } from '@koyeb/design-system';
import { useSecretsQuery } from 'src/api/hooks/secret';
import { Secret } from 'src/api/model';
import { Dialog } from 'src/components/dialog';
import { DocumentTitle } from 'src/components/document-title';
import { IconListPlus, IconPlus } from 'src/components/icons';
import { QueryGuard } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { useSet } from 'src/hooks/collection';
import { useOnRouteStateCreate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { BulkCreateSecretsDialog } from './components/bulk-create-secrets-dialog';
import { BulkDeleteSecretsDialog } from './components/bulk-delete-secret-dialog';
import { SecretsList } from './components/secrets-list';

const T = createTranslate('pages.secrets');

export function SecretsPage() {
  const openDialog = Dialog.useOpen();

  useOnRouteStateCreate(() => {
    openDialog('CreateSecret');
  });

  const query = useSecretsQuery('simple');
  const secrets = query.data;

  const [selected, { toggle, set, clear }] = useSet<Secret>();

  return (
    <div className="col gap-8">
      <DocumentTitle title="Secrets" />

      <Title
        title={<T id="title" />}
        end={
          <div className="row items-center gap-2">
            {selected.size > 0 && (
              <Button variant="outline" onClick={() => openDialog('ConfirmBulkDeleteSecrets')}>
                <T id="deleteSecrets" values={{ count: selected.size }} />
              </Button>
            )}

            <Button variant="outline" onClick={() => openDialog('BulkCreateSecrets')}>
              <IconListPlus className="size-4" />
              <T id="importSecrets" />
            </Button>

            <Button
              className={clsx(secrets && secrets.length === 0 && 'hidden')}
              onClick={() => openDialog('CreateSecret')}
            >
              <IconPlus className="size-4" />
              <T id="createSecret" />
            </Button>
          </div>
        }
      />

      <QueryGuard query={query}>
        {(secrets) => (
          <SecretsList
            secrets={secrets}
            onCreate={() => openDialog('CreateSecret')}
            selection={{ selected, selectAll: () => set(secrets), clear, toggle }}
          />
        )}
      </QueryGuard>

      <BulkDeleteSecretsDialog secrets={Array.from(selected.values())} onDeleted={clear} />
      <BulkCreateSecretsDialog />
      <CreateSecretDialog />
    </div>
  );
}
