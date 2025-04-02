import { useMutation } from '@tanstack/react-query';

import { api } from 'src/api/api';
import { DatabaseDeployment, LogicalDatabase, Service } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useToken } from 'src/application/token';
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

  const { token } = useToken();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    async mutationFn() {
      const { deployment: apiDeployment } = await api.getDeployment({
        token,
        path: { id: deployment.id },
      });

      const definition = apiDeployment!.definition!;

      definition.database!.neon_postgres!.databases = definition.database!.neon_postgres!.databases!.filter(
        ({ name }) => name !== database.name,
      );

      await api.updateService({
        token,
        path: { id: service.id },
        query: {},
        body: { definition },
      });
    },
    async onSuccess() {
      await invalidate('getService', { path: { id: service.id } });
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
