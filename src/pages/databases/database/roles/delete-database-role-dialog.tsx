import { useMutation } from '@tanstack/react-query';

import { DatabaseRole, Service } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { updateDatabaseService } from 'src/application/service-functions';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

const T = Translate.prefix('pages.database.roles.deleteDialog');

type DeleteDatabaseRoleDialogProps = {
  open: boolean;
  onClose: () => void;
  service: Service;
  role: DatabaseRole;
};

export function DeleteDatabaseRoleDialog({ open, onClose, service, role }: DeleteDatabaseRoleDialogProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    async mutationFn() {
      await updateDatabaseService(service.id, (definition) => {
        const roles = definition.database!.neon_postgres!.roles!;
        const index = roles.findIndex(hasProperty('name', role.name));

        if (index >= 0) {
          roles.splice(index, 1);
        }
      });
    },
    async onSuccess() {
      await invalidate('getService', { path: { id: service.id } });
      notify.info(t('successNotification', { name: role.name }));
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
      confirmationText={role.name}
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
