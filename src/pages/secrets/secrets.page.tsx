import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useSecretsQuery } from 'src/api/hooks/secret';
import { Secret } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useToken } from 'src/application/token';
import { DocumentTitle } from 'src/components/document-title';
import { IconListPlus, IconPlus } from 'src/components/icons';
import { Title } from 'src/components/title';
import { useSet } from 'src/hooks/collection';
import { useHistoryState } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { BulkCreateSecretsDialog } from './components/bulk-create-secrets-dialog';
import { SecretsList } from './components/secrets-list';

const T = Translate.prefix('pages.secrets');

export function SecretsPage() {
  const t = T.useTranslate();

  const historyState = useHistoryState<{ create: boolean }>();
  const [createDialogOpen, setCreateDialogOpen] = useState(Boolean(historyState.create));
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false);
  const { data: secrets } = useSecretsQuery('simple');

  const { token } = useToken();
  const invalidate = useInvalidateApiQuery();
  const [selected, { toggle, clear }] = useSet<Secret>();

  const bulkDelete = useMutation({
    async mutationFn(secrets: Secret[]) {
      return Promise.allSettled(
        secrets.map((secret) => api.deleteSecret({ token, path: { id: secret.id } })),
      );
    },
    async onSuccess(result) {
      await invalidate('listSecrets');

      clear();

      const fulfilled = result.filter((result) => result.status === 'fulfilled');
      notify.success(t('bulkDeleted', { count: fulfilled.length }));
    },
  });

  return (
    <div className="col gap-8">
      <DocumentTitle title="Secrets" />

      <Title
        title={<T id="title" />}
        end={
          <div className="row items-center gap-2">
            {selected.size > 0 && (
              <Button
                variant="outline"
                loading={bulkDelete.isPending}
                onClick={() => bulkDelete.mutate(Array.from(selected.values()))}
              >
                <T id="deleteSecrets" values={{ count: selected.size }} />
              </Button>
            )}

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

      <SecretsList onCreate={() => setCreateDialogOpen(true)} selected={selected} toggleSelected={toggle} />

      <CreateSecretDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => setCreateDialogOpen(false)}
      />

      <BulkCreateSecretsDialog open={bulkCreateDialogOpen} onClose={() => setBulkCreateDialogOpen(false)} />
    </div>
  );
}
