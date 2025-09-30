import { useMutation } from '@tanstack/react-query';

import { useInvalidateApiQuery } from 'src/api/api';
import { DatabaseDeployment, LogicalDatabase, Service } from 'src/api/model';
import { getApi } from 'src/application/container';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.database.logicalDatabases.deleteDialog');

type DeleteLogicalDatabaseDialogProps = {
  service: Service;
  deployment: DatabaseDeployment;
  database: LogicalDatabase;
};

export function DeleteLogicalDatabaseDialog({
  service,
  deployment,
  database,
}: DeleteLogicalDatabaseDialogProps) {
  const t = T.useTranslate();

  const closeDialog = Dialog.useClose();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    async mutationFn() {
      const api = getApi();

      const { deployment: apiDeployment } = await api('get /v1/deployments/{id}', {
        path: { id: deployment.id },
      });

      const definition = apiDeployment!.definition!;

      definition.database!.neon_postgres!.databases = definition.database!.neon_postgres!.databases!.filter(
        ({ name }) => name !== database.name,
      );

      await api('put /v1/services/{id}', {
        path: { id: service.id },
        query: {},
        body: { definition },
      });
    },
    async onSuccess() {
      await invalidate('get /v1/services/{id}', { path: { id: service.id } });
      notify.info(t('successNotification', { name: database.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteLogicalDatabase"
      resourceId={database.name}
      title={<T id="title" />}
      description={<T id="description" />}
      destructiveAction
      confirmationText={database.name}
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
