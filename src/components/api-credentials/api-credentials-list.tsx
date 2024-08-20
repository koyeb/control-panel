import { useState } from 'react';

import { Button, ButtonMenuItem, Table } from '@koyeb/design-system';
import { ApiCredential, ApiCredentialType } from 'src/api/model';
import { NoResource } from 'src/components/no-resource';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';

import { ActionsMenu } from '../actions-menu';

import { DeleteCredentialDialog } from './delete-api-credential';

type ApiCredentialListProps = {
  type: ApiCredentialType;
  credentials: ApiCredential[];
  onCreate: () => void;
};

export function ApiCredentialsList({ type, credentials, onCreate }: ApiCredentialListProps) {
  const T = Translate.prefix(`pages.${type}Settings.apiCredential.list`);

  if (credentials.length === 0) {
    return (
      <NoResource
        title={<T id="noApiCredentials.title" />}
        description={<T id="noApiCredentials.description" />}
        cta={
          <Button onClick={onCreate}>
            <T id="noApiCredentials.cta" />
          </Button>
        }
      />
    );
  }

  return (
    <Table
      items={credentials}
      columns={{
        name: {
          header: <T id="name" />,
          render: (credential) => credential.name,
        },
        description: {
          header: <T id="description" />,
          render: (credential) => credential.description,
        },
        created: {
          className: 'lg:w-48',
          header: <T id="created" />,
          render: (credential) => <FormattedDistanceToNow value={credential.createdAt} />,
        },
        actions: {
          className: 'w-12',
          render: (credential) => <CredentialActions type={type} credential={credential} />,
        },
      }}
    />
  );
}

function CredentialActions({ type, credential }: { type: ApiCredentialType; credential: ApiCredential }) {
  const T = Translate.prefix(`pages.${type}Settings.apiCredential.list`);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <ButtonMenuItem onClick={withClose(() => setDeleteDialogOpen(true))}>
            <T id="actions.delete" />
          </ButtonMenuItem>
        )}
      </ActionsMenu>

      <DeleteCredentialDialog
        type={type}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        credential={credential}
      />
    </>
  );
}
