import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { api } from 'src/api/api';
import { Service } from 'src/api/model';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.settings.deleteService');

type DeleteServiceCardProps = {
  service: Service;
};

export function DeleteServiceCard({ service }: DeleteServiceCardProps) {
  const t = T.useTranslate();
  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();
  const navigate = useNavigate();

  const { mutateAsync: deleteService } = useMutation({
    mutationFn: async () => {
      await api.deleteService({
        path: { id: service.id },
      });

      const { services } = await api.listServices({
        query: { app_id: service.appId },
      });

      if (services?.length === 1) {
        await api.deleteApp({
          path: { id: service.appId },
        });
      }
    },
    onSuccess: () => {
      closeDialog();
      navigate({ to: '/' });
      notify.info(t('deleting'));
    },
  });

  return (
    <div className="col-start-1 card row items-center gap-4 p-3">
      <div className="col flex-1 gap-2">
        <strong>
          <T id="title" />
        </strong>

        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <div className="ml-auto row gap-4">
        <Button
          color="red"
          onClick={() => openDialog('ConfirmDeleteService', { resourceId: service.id })}
          disabled={service.status === 'PAUSING' || service.status === 'DELETED'}
        >
          <T id="delete" />
        </Button>
      </div>

      <ConfirmationDialog
        id="ConfirmDeleteService"
        resourceId={service.id}
        title={<T id="confirmationDialog.title" />}
        description={<T id="confirmationDialog.description" />}
        destructiveAction
        confirmationText={service.name}
        submitText={<T id="confirmationDialog.confirm" />}
        onConfirm={deleteService}
      />
    </div>
  );
}
