import { Table } from '@koyeb/design-system';
import { ApiCredential, ApiCredentialType } from 'src/api/model';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { TextSkeleton } from 'src/components/skeleton';
import { Translate } from 'src/intl/translate';

import { ApiCredentialsList } from './api-credentials-list';
import { CreateApiCredentialDialog } from './create-api-credential-dialog';

type ApiCredentialsProps = {
  type: ApiCredentialType;
  loading: boolean;
  error: Error | null;
  credentials?: ApiCredential[];
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
};

export function ApiCredentials({
  type,
  loading,
  error,
  credentials = [],
  createDialogOpen,
  setCreateDialogOpen,
}: ApiCredentialsProps) {
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
      <ApiCredentialsList type={type} credentials={credentials} onCreate={() => setCreateDialogOpen(true)} />

      <CreateApiCredentialDialog
        type={type}
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
}

function Skeleton({ type }: { type: ApiCredentialType }) {
  const T = Translate.prefix(`pages.${type}Settings.apiCredential.list`);

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
