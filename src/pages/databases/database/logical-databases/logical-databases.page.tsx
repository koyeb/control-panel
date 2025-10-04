import { Button, ButtonMenuItem, Table } from '@koyeb/design-system';
import clsx from 'clsx';

import { isDatabaseDeployment, useDeployment, useService } from 'src/api';
import { ActionsMenu } from 'src/components/actions-menu';
import { openDialog } from 'src/components/dialog';
import { NoResource } from 'src/components/no-resource';
import { Title } from 'src/components/title';
import { useOnRouteStateCreate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { LogicalDatabase } from 'src/model';
import { assert } from 'src/utils/assert';
import { getName } from 'src/utils/object';

import { CreateLogicalDatabaseDialog } from './create-logical-database-dialog';
import { DeleteLogicalDatabaseDialog } from './delete-logical-database-dialog';

const T = createTranslate('pages.database.logicalDatabases');

export function LogicalDatabasesPage() {
  const databaseServiceId = useRouteParam('databaseServiceId');
  const service = useService(databaseServiceId);
  const deployment = useDeployment(service?.latestDeploymentId);

  useOnRouteStateCreate(() => {
    if (service) {
      openDialog('CreateLogicalDatabase');
    }
  });

  if (!service || !deployment) {
    return null;
  }

  assert(isDatabaseDeployment(deployment));

  const databases = deployment.databases ?? [];

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          databases.length > 0 && (
            <Button onClick={() => openDialog('CreateLogicalDatabase')}>
              <T id="createDatabase" />
            </Button>
          )
        }
      />

      {databases.length === 0 && (
        <NoResource
          title={<T id="noDatabase.title" />}
          description={<T id="noDatabase.description" />}
          cta={
            <Button onClick={() => openDialog('CreateLogicalDatabase')}>
              <T id="noDatabase.cta" />
            </Button>
          }
        />
      )}

      {databases.length > 0 && (
        <Table
          items={databases}
          getKey={getName}
          columns={{
            name: {
              header: <T id="name" />,
              render: (database) => database.name,
            },
            owner: {
              header: <T id="owner" />,
              render: (database) => database.owner,
            },
            actions: {
              className: clsx('w-12'),
              render: (database) => <DatabaseActions database={database} />,
            },
          }}
        />
      )}

      <CreateLogicalDatabaseDialog service={service} deployment={deployment} />
      <DeleteLogicalDatabaseDialog service={service} deployment={deployment} />
    </>
  );
}

function DatabaseActions({ database }: { database: LogicalDatabase }) {
  return (
    <ActionsMenu>
      {(withClose) => (
        <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmDeleteLogicalDatabase', database))}>
          <T id="actions.delete" />
        </ButtonMenuItem>
      )}
    </ActionsMenu>
  );
}
