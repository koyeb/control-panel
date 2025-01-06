import { Table } from '@koyeb/design-system';
import { ApiCredential, ApiCredentialType } from 'src/api/model';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { TextSkeleton } from 'src/components/skeleton';
import { createTranslate } from 'src/intl/translate';

import { Dialog } from '../dialog';

import { ApiCredentialsList } from './api-credentials-list';
import { CreateApiCredentialDialog } from './create-api-credential-dialog';

type ApiCredentialsProps = {
  type: ApiCredentialType;
  loading: boolean;
  error: Error | null;
  credentials?: ApiCredential[];
};

export function ApiCredentials({ type, loading, error, credentials = [] }: ApiCredentialsProps) {
  const openDialog = Dialog.useOpen();

  if (loading) {
    return (
      <Loading>
        <Skeleton type={type} />
      </Loading>
    );
  }

  if (error !== null) {
    return <QueryError error={error} />;
  }

  return (
    <>
      <ApiCredentialsList
        type={type}
        credentials={credentials}
        onCreate={() => openDialog('CreateApiCredential')}
      />

      <CreateApiCredentialDialog type={type} />
    </>
  );
}

function Skeleton({ type }: { type: ApiCredentialType }) {
  const T = createTranslate(`pages.${type}Settings.apiCredential.list`);

  return (
    <Table
      items={[null]}
      columns={{
        name: {
          header: <T id="name" />,
          render: () => <TextSkeleton width={16} />,
        },
        description: {
          header: <T id="description" />,
          render: () => <TextSkeleton width={32} />,
        },
        created: {
          className: 'lg:w-48',
          header: <T id="created" />,
          render: () => <TextSkeleton width={16} />,
        },
        actions: {
          className: 'w-12',
          render: () => <TextSkeleton width={1} />,
        },
      }}
    />
  );
}
