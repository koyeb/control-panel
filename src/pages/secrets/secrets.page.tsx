import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { getApi, useInvalidateApiQuery, useSecretsQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
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
import { EditSecretDialog } from './components/edit-secret-dialog';
import { SecretsList } from './components/secrets-list';

const T = createTranslate('pages.secrets');

export function SecretsPage() {
  const t = T.useTranslate();

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

  const bulkDelete = useBulkDeleteMutation(onChanged);

  const onBulkDelete = () => {
    openDialog('Confirmation', {
      title: t('bulkDelete.title'),
      description: t('bulkDelete.description', { count: selected.size }),
      confirmationText: t('bulkDelete.confirmationText'),
      submitText: t('bulkDelete.cta'),
      onConfirm: () => bulkDelete.mutateAsync(Array.from(selected.values())),
    });
  };

  return (
    <div className="col gap-8">
      <DocumentTitle title="Secrets" />

      <Title
        title={<T id="title" />}
        end={
          <div className="row items-center gap-2">
            {selected.size > 0 && (
              <Button variant="outline" onClick={onBulkDelete}>
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
            onDeleted={onChanged}
            selection={{ selected, selectAll: () => set(secrets), clear, toggle }}
          />
        )}
      </QueryGuard>

      {pagination.hasPages && <Pagination pagination={pagination} />}

      <BulkCreateSecretsDialog onCreated={onChanged} />
      <CreateSecretDialog onCreated={onChanged} />
      <EditSecretDialog />
    </div>
  );
}

function useBulkDeleteMutation(onDeleted: () => void) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    async mutationFn(secrets: Secret[]) {
      const api = getApi();

      return Promise.allSettled(
        secrets.map((secret) => api('delete /v1/secrets/{id}', { path: { id: secret.id } })),
      );
    },
    async onSuccess(result) {
      await invalidate('get /v1/secrets');

      const fulfilled = result.filter((result) => result.status === 'fulfilled');
      notify.success(t('bulkDelete.successNotification', { count: fulfilled.length }));

      closeDialog();
      onDeleted();
    },
  });
}
