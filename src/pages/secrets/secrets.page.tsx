import { Button } from '@koyeb/design-system';
import clsx from 'clsx';

import { useSecretsQuery } from 'src/api';
import { openDialog } from 'src/components/dialog';
import { DocumentTitle } from 'src/components/document-title';
import { Pagination } from 'src/components/pagination';
import { QueryGuard } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { useSet } from 'src/hooks/collection';
import { useOnRouteStateCreate } from 'src/hooks/router';
import { IconListPlus, IconPlus } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { Secret } from 'src/model';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { BulkCreateSecretsDialog } from './components/bulk-create-secrets-dialog';
import { BulkDeleteSecretsDialog } from './components/bulk-delete-secret-dialog';
import { DeleteSecretDialog } from './components/delete-secret-dialog';
import { EditSecretDialog } from './components/edit-secret-dialog';
import { SecretsList } from './components/secrets-list';

const T = createTranslate('pages.secrets');

export function SecretsPage() {
  useOnRouteStateCreate(() => {
    openDialog('CreateSecret');
  });

  const [query, pagination] = useSecretsQuery('simple');
  const secrets = query.data?.secrets;

  const [selected, { toggle, set, clear }] = useSet<Secret>();

  const onChanged = () => {
    pagination.setPage(1);
    clear();
  };

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
              className={clsx(secrets && secrets.length === 0 && '!hidden')}
              onClick={() => openDialog('CreateSecret')}
            >
              <IconPlus className="size-4" />
              <T id="createSecret" />
            </Button>
          </div>
        }
      />

      <QueryGuard query={query}>
        {({ secrets }) => (
          <SecretsList
            secrets={secrets}
            onCreate={() => openDialog('CreateSecret')}
            selection={{ selected, selectAll: () => set(secrets), clear, toggle }}
          />
        )}
      </QueryGuard>

      {pagination.hasPages && <Pagination pagination={pagination} />}

      <EditSecretDialog />
      <DeleteSecretDialog onDeleted={onChanged} />

      <BulkDeleteSecretsDialog secrets={Array.from(selected.values())} onDeleted={onChanged} />
      <BulkCreateSecretsDialog onCreated={onChanged} />
      <CreateSecretDialog onCreated={onChanged} />
    </div>
  );
}
