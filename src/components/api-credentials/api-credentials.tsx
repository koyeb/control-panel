import { Table } from '@koyeb/design-system';

import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { TextSkeleton } from 'src/components/skeleton';
import { createTranslate } from 'src/intl/translate';
import { ApiCredential, ApiCredentialType } from 'src/model';

import { openDialog } from '../dialog';

import { ApiCredentialsList } from './api-credentials-list';
import { CreateApiCredentialDialog } from './create-api-credential-dialog';

const TO = createTranslate('pages.organizationSettings.apiCredential');
const TU = createTranslate('pages.userSettings.apiCredential');

type ApiCredentialsProps = {
  type: ApiCredentialType;
  loading: boolean;
  error: Error | null;
  credentials?: ApiCredential[];
};

export function ApiCredentials({ type, loading, error, credentials = [] }: ApiCredentialsProps) {
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
  const T = type === 'organization' ? TO : TU;

  return (
    <Table
      items={[null]}
      columns={{
        name: {
          header: <T id="list.name" />,
          render: () => <TextSkeleton width={16} />,
        },
        description: {
          header: <T id="list.description" />,
          render: () => <TextSkeleton width={32} />,
        },
        created: {
          className: 'lg:w-48',
          header: <T id="list.created" />,
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
