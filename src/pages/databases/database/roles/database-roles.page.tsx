import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { Button, ButtonMenuItem, Spinner, Table, Tooltip } from '@koyeb/design-system';
import { useDeployment, useService } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { DatabaseRole, Service } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { IconEye, IconEyeOff } from 'src/components/icons';
import { NoResource } from 'src/components/no-resource';
import { Title } from 'src/components/title';
import { useClipboard } from 'src/hooks/clipboard';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate, Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { getName } from 'src/utils/object';

import { CreateDatabaseRoleDialog } from './create-database-role-dialog';
import { DeleteDatabaseRoleDialog } from './delete-database-role-dialog';

const T = createTranslate('pages.database.roles');

export function DatabaseRolesPage() {
  const service = useService(useRouteParam('databaseServiceId'));
  const deployment = useDeployment(service?.latestDeploymentId);

  assert(service !== undefined);
  assert(isDatabaseDeployment(deployment));

  const [createRole, setCreateRole] = useState(false);
  const roles = deployment.roles ?? [];

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          roles.length > 0 && (
            <Button onClick={() => setCreateRole(true)}>
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
            <Button onClick={() => setCreateRole(true)}>
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

      <CreateDatabaseRoleDialog open={createRole} onClose={() => setCreateRole(false)} service={service} />
    </>
  );
}

const masked = '•••••••••••••••';

function DatabaseRolePassword({ role }: { role: DatabaseRole }) {
  const [showValue, setShowValue] = useState(false);

  const query = useQuery({
    ...useApiQueryFn('revealSecret', { path: { id: role.secretId } }),
    enabled: showValue,
    refetchInterval: false,
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
        <Tooltip content={<Translate id="common.clickToCopy" />}>
          {(props) => (
            <button {...props} className="max-w-md truncate" onClick={copyValue}>
              {query.data.password}
            </button>
          )}
        </Tooltip>
      ) : (
        <div className="text-dim">{masked}</div>
      )}
    </div>
  );
}

type DatabaseRoleActionsProps = {
  service: Service;
  role: DatabaseRole;
};

function DatabaseRoleActions({ service, role }: DatabaseRoleActionsProps) {
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

      <DeleteDatabaseRoleDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        service={service}
        role={role}
      />
    </>
  );
}
