import { Button, Table } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { isDatabaseDeployment, useApi, useDeployment, useInvalidateApiQuery, useService } from 'src/api';
import { notify } from 'src/application/notify';
import { updateDatabaseService } from 'src/application/service-functions';
import { closeDialog, openDialog } from 'src/components/dialog';
import { ActionsMenu, ButtonMenuItem } from 'src/components/dropdown-menu';
import { NoResource } from 'src/components/no-resource';
import { Title } from 'src/components/title';
import { useOnRouteStateCreate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { LogicalDatabase, Service } from 'src/model';
import { assert } from 'src/utils/assert';
import { getName, hasProperty } from 'src/utils/object';

import { CreateLogicalDatabaseDialog } from './create-logical-database-dialog';

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
              render: (database) => <DatabaseActions service={service} database={database} />,
            },
          }}
        />
      )}

      <CreateLogicalDatabaseDialog service={service} deployment={deployment} />
    </>
  );
}

function DatabaseActions({ service, database }: { service: Service; database: LogicalDatabase }) {
  const t = T.useTranslate();

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description'),
      destructiveAction: true,
      confirmationText: database.name,
      submitText: t('delete.confirm'),
      onConfirm: () => deleteMutation.mutateAsync([service, database]),
    });
  };

  return (
    <ActionsMenu>
      <ButtonMenuItem onClick={onDelete}>
        <T id="actions.delete" />
      </ButtonMenuItem>
    </ActionsMenu>
  );
}

function useDeleteMutation() {
  const t = T.useTranslate();

  const api = useApi();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    async mutationFn([service, database]: [service: Service, database: LogicalDatabase]) {
      return updateDatabaseService(api, service.id, (definition) => {
        const databases = definition.database!.neon_postgres!.databases!;
        const index = databases.findIndex(hasProperty('name', database.name));

        if (index >= 0) {
          databases.splice(index, 1);
        }
      });
    },
    async onSuccess(_, [service, database]) {
      await invalidate('get /v1/services/{id}', { path: { id: service.id } });
      notify.info(t('delete.success', { name: database.name }));
      closeDialog();
    },
  });
}
