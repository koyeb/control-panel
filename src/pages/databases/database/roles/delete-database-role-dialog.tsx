import { useMutation } from '@tanstack/react-query';

import { useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { updateDatabaseService } from 'src/application/service-functions';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { closeDialog, useDialogContext } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.database.roles.deleteDialog');

type DeleteDatabaseRoleDialogProps = {
  service: Service;
};

export function DeleteDatabaseRoleDialog({ service }: DeleteDatabaseRoleDialogProps) {
  const t = T.useTranslate();
  const role = useDialogContext<'ConfirmDeleteDatabaseRole'>();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    async mutationFn() {
      await updateDatabaseService(service.id, (definition) => {
        const roles = definition.database!.neon_postgres!.roles!;
        const index = roles.findIndex(hasProperty('name', role?.name));

        if (index >= 0) {
          roles.splice(index, 1);
        }
      });
    },
    async onSuccess() {
      await invalidate('get /v1/services/{id}', { path: { id: service.id } });
      notify.info(t('successNotification', { name: role?.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteDatabaseRole"
      title={<T id="title" />}
      description={<T id="description" />}
      destructiveAction
      confirmationText={role?.name ?? ''}
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
