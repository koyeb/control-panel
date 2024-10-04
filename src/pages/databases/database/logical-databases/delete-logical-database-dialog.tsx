import { useMutation } from '@tanstack/react-query';

import { api } from 'src/api/api';
import { DatabaseDeployment, LogicalDatabase, Service } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useToken } from 'src/application/token';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.database.logicalDatabases.deleteDialog');

type DeleteLogicalDatabaseDialogProps = {
  open: boolean;
  onClose: () => void;
  service: Service;
  deployment: DatabaseDeployment;
  database: LogicalDatabase;
};

export function DeleteLogicalDatabaseDialog({
  open,
  onClose,
  service,
  deployment,
  database,
}: DeleteLogicalDatabaseDialogProps) {
  const t = T.useTranslate();
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
      onClose();
    },
  });

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      destructiveAction
      confirmationText={database.name}
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
