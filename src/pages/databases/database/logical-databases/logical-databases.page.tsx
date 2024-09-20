import clsx from 'clsx';
import { useState } from 'react';

import { Button, ButtonMenuItem, Table } from '@koyeb/design-system';
import { useDeployment, useService } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { DatabaseDeployment, LogicalDatabase, Service } from 'src/api/model';
import { ActionsMenu } from 'src/components/actions-menu';
import { NoResource } from 'src/components/no-resource';
import { Title } from 'src/components/title';
import { useHistoryState, useRouteParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { getName } from 'src/utils/object';

import { CreateLogicalDatabaseDialog } from './create-logical-database-dialog';
import { DeleteLogicalDatabaseDialog } from './delete-logical-database-dialog';

const T = Translate.prefix('pages.database.logicalDatabases');

export function LogicalDatabasesPage() {
  const service = useService(useRouteParam('databaseServiceId'));
  const deployment = useDeployment(service?.latestDeploymentId);

  assert(service !== undefined);
  assert(isDatabaseDeployment(deployment));

  const databases = deployment.databases ?? [];

  const historyState = useHistoryState<{ create: boolean }>();
  const [createDatabase, setCreateDatabase] = useState(Boolean(historyState.create));

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          databases.length > 0 && (
            <Button onClick={() => setCreateDatabase(true)}>
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
            <Button onClick={() => setCreateDatabase(true)}>
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

      <CreateLogicalDatabaseDialog
        open={createDatabase}
        onClose={() => setCreateDatabase(false)}
        service={service}
        deployment={deployment}
      />
    </>
  );
}

type DatabaseActionsProps = {
  service: Service;
  deployment: DatabaseDeployment;
  database: LogicalDatabase;
};

function DatabaseActions({ service, deployment, database }: DatabaseActionsProps) {
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

      <DeleteLogicalDatabaseDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        service={service}
        deployment={deployment}
        database={database}
      />
    </>
  );
}
