import { Button, ButtonMenuItem, Table } from '@koyeb/design-system';
import clsx from 'clsx';

import { useDeployment, useService } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { DatabaseDeployment, LogicalDatabase, Service } from 'src/api/model';
import { ActionsMenu } from 'src/components/actions-menu';
import { Dialog } from 'src/components/dialog';
import { NoResource } from 'src/components/no-resource';
import { Title } from 'src/components/title';
import { useOnRouteStateCreate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { getName } from 'src/utils/object';

import { CreateLogicalDatabaseDialog } from './create-logical-database-dialog';
import { DeleteLogicalDatabaseDialog } from './delete-logical-database-dialog';

const T = createTranslate('pages.database.logicalDatabases');

export function LogicalDatabasesPage() {
  const databaseServiceId = useRouteParam('databaseServiceId');
  const service = useService(databaseServiceId);
  const deployment = useDeployment(service?.latestDeploymentId);

  const openDialog = Dialog.useOpen();

  useOnRouteStateCreate(() => {
    openDialog('CreateLogicalDatabase');
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
              render: (database) => (
                <DatabaseActions service={service} deployment={deployment} database={database} />
              ),
            },
          }}
        />
      )}

      <CreateLogicalDatabaseDialog service={service} deployment={deployment} />
    </>
  );
}

type DatabaseActionsProps = {
  service: Service;
  deployment: DatabaseDeployment;
  database: LogicalDatabase;
};

function DatabaseActions({ service, deployment, database }: DatabaseActionsProps) {
  const openDialog = Dialog.useOpen();

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <ButtonMenuItem
            onClick={withClose(() =>
              openDialog('ConfirmDeleteLogicalDatabase', { resourceId: database.name }),
            )}
          >
            <T id="actions.delete" />
          </ButtonMenuItem>
        )}
      </ActionsMenu>

      <DeleteLogicalDatabaseDialog service={service} deployment={deployment} database={database} />
    </>
  );
}
