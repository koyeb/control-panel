import clsx from 'clsx';
import { useState } from 'react';

import { Button, ButtonMenuItem, Table } from '@koyeb/design-system';
import { useSecretsQuery } from 'src/api/hooks/secret';
import { RegistrySecret } from 'src/api/model';
import { ActionsMenu } from 'src/components/actions-menu';
import { Dialog } from 'src/components/dialog';
import { NoResource } from 'src/components/no-resource';
import { QueryError } from 'src/components/query-error';
import { TextSkeleton } from 'src/components/skeleton';
import { createTranslate } from 'src/intl/translate';
import { RegistryType } from 'src/modules/secrets/registry/registry-type';
import { createArray } from 'src/utils/arrays';

import { DeleteRegistrySecretDialog } from './delete-registry-secret-dialog';
import { EditRegistrySecretDialog } from './edit-registry-secret-dialog';

const T = createTranslate('pages.organizationSettings.registrySecrets.list');

export function RegistrySecretList({ onCreate }: { onCreate: () => void }) {
  const secretsQuery = useSecretsQuery('registry');

  if (secretsQuery.isPending) {
    return <Skeleton />;
  }

  if (secretsQuery.isError) {
    return <QueryError error={secretsQuery.error} />;
  }

  const secrets = secretsQuery.data as RegistrySecret[];

  if (secrets.length === 0) {
    return (
      <NoResource
        title={<T id="noSecrets.title" />}
        description={<T id="noSecrets.description" />}
        cta={
          <Button onClick={onCreate}>
            <T id="noSecrets.cta" />
          </Button>
        }
      />
    );
  }

  return (
    <Table
      items={secrets}
      columns={{
        name: {
          header: <T id="name" />,
          className: clsx('lg:w-72'),
          render: (secret) => <>{secret.name}</>,
        },
        type: {
          header: <T id="type" />,
          render: (secret) => <RegistryType registry={secret.registry} />,
        },
        actions: {
          className: clsx('w-12'),
          render: (secret) => <RegistrySecretActions secret={secret} />,
        },
      }}
    />
  );
}

function Skeleton() {
  return (
    <Table
      items={createArray(5, (index) => index)}
      columns={{
        name: {
          header: <T id="name" />,
          className: clsx('lg:w-72'),
          render: () => <TextSkeleton width={12} />,
        },
        type: {
          header: <T id="type" />,
          render: () => <TextSkeleton width={12} />,
        },
        actions: {
          className: clsx('w-12'),
          render: () => null,
        },
      }}
    />
  );
}

function RegistrySecretActions({ secret }: { secret: RegistrySecret }) {
  const [deleteDialogOpen, setDeleteOpenDialog] = useState(false);
  const openDialog = Dialog.useOpen();

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <>
            <ButtonMenuItem onClick={withClose(() => openDialog(`EditRegistrySecret-${secret.id}`))}>
              <T id="actions.edit" />
            </ButtonMenuItem>

            <ButtonMenuItem onClick={withClose(() => setDeleteOpenDialog(true))}>
              <T id="actions.delete" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <EditRegistrySecretDialog secret={secret} />

      <DeleteRegistrySecretDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteOpenDialog(false)}
        secret={secret}
      />
    </>
  );
}
