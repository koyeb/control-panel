import { Button, Spinner, Table } from '@koyeb/design-system';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import {
  apiQuery,
  isDatabaseDeployment,
  useApi,
  useDeployment,
  useInvalidateApiQuery,
  useService,
} from 'src/api';
import { notify } from 'src/application/notify';
import { updateDatabaseService } from 'src/application/service-functions';
import { closeDialog, openDialog } from 'src/components/dialog';
import { ActionsMenu, ButtonMenuItem } from 'src/components/dropdown-menu';
import { NoResource } from 'src/components/no-resource';
import { Title } from 'src/components/title';
import { Tooltip } from 'src/components/tooltip';
import { useClipboard } from 'src/hooks/clipboard';
import { useRouteParam } from 'src/hooks/router';
import { IconEye, IconEyeOff } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { DatabaseRole, Service } from 'src/model';
import { assert } from 'src/utils/assert';
import { getName, hasProperty } from 'src/utils/object';

import { CreateDatabaseRoleDialog } from './create-database-role-dialog';

const T = createTranslate('pages.database.roles');

export function DatabaseRolesPage() {
  const databaseServiceId = useRouteParam('databaseServiceId');
  const service = useService(databaseServiceId);
  const deployment = useDeployment(service?.latestDeploymentId);

  if (!service || !deployment) {
    return null;
  }

  assert(isDatabaseDeployment(deployment));

  const roles = deployment.roles ?? [];

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          roles.length > 0 && (
            <Button onClick={() => openDialog('CreateDatabaseRole')}>
              <T id="createRole" />
            </Button>
          )
        }
      />

      {roles.length === 0 && (
        <NoResource
          title={<T id="noRole.title" />}
          description={<T id="noRole.description" />}
          cta={
            <Button onClick={() => openDialog('CreateDatabaseRole')}>
              <T id="noRole.cta" />
            </Button>
          }
        />
      )}

      {roles.length > 0 && (
        <Table
          items={roles}
          getKey={getName}
          columns={{
            name: {
              className: clsx('lg:w-64'),
              header: <T id="name" />,
              render: (role) => role.name,
            },
            password: {
              header: <T id="password" />,
              render: (role) => <DatabaseRolePassword role={role} />,
            },
            actions: {
              className: clsx('w-12'),
              render: (role) => <DatabaseRoleActions service={service} role={role} />,
            },
          }}
        />
      )}

      <CreateDatabaseRoleDialog service={service} />
    </>
  );
}

const masked = '•••••••••••••••';

function DatabaseRolePassword({ role }: { role: DatabaseRole }) {
  const [showValue, setShowValue] = useState(false);

  const query = useQuery({
    ...apiQuery('post /v1/secrets/{id}/reveal', { path: { id: role.secretId } }),
    enabled: showValue,
    placeholderData: keepPreviousData,
    select: (result) => result.value as unknown as { password: string },
  });

  const icon = () => {
    if (query.isLoading) {
      return <Spinner className="size-4" />;
    }

    if (showValue) {
      return <IconEyeOff className="size-4" />;
    }

    return <IconEye className="size-4" />;
  };

  const copy = useClipboard();
  const t = T.useTranslate();

  const copyValue = () => {
    copy(query.data?.password ?? '', () => notify.info(t('copySuccess')));
  };

  return (
    <div className="row gap-2">
      <Button color="gray" size={1} className="px-1 py-0" onClick={() => setShowValue(!showValue)}>
        {icon()}
      </Button>

      {showValue && query.data !== undefined ? (
        <Tooltip
          forceDesktop
          content={<Translate id="common.clickToCopy" />}
          trigger={(props) => (
            <button {...props} className="max-w-md truncate" onClick={copyValue}>
              {query.data.password}
            </button>
          )}
        />
      ) : (
        <div className="text-dim">{masked}</div>
      )}
    </div>
  );
}

function DatabaseRoleActions({ service, role }: { service: Service; role: DatabaseRole }) {
  const t = T.useTranslate();

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description'),
      destructiveAction: true,
      confirmationText: role.name,
      submitText: t('delete.confirm'),
      onConfirm: () => deleteMutation.mutateAsync([service, role]),
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
    async mutationFn([service, role]: [service: Service, role: DatabaseRole]) {
      await updateDatabaseService(api, service.id, (definition) => {
        const roles = definition.database!.neon_postgres!.roles!;
        const index = roles.findIndex(hasProperty('name', role.name));

        if (index >= 0) {
          roles.splice(index, 1);
        }
      });
    },
    async onSuccess(_, [service, role]) {
      await invalidate('get /v1/services/{id}', { path: { id: service.id } });
      notify.info(t('delete.success', { name: role.name }));
      closeDialog();
    },
  });
}
