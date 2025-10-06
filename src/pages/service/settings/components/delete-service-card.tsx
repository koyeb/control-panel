import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, getApi } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('pages.service.settings.delete');

type DeleteServiceCardProps = {
  service: Service;
};

export function DeleteServiceCard({ service }: DeleteServiceCardProps) {
  const t = T.useTranslate();

  const navigate = useNavigate();

  const deleteAppMutation = useMutation({
    ...apiMutation('delete /v1/apps/{id}', (appId: string) => ({
      path: { id: appId },
    })),
  });

  const deleteServiceMutation = useMutation({
    ...apiMutation('delete /v1/services/{id}', (service: Service) => ({
      path: { id: service.id },
    })),
    async onSuccess(_, service) {
      const api = getApi();

      const { services } = await api('get /v1/services', {
        query: { app_id: service.appId },
      });

      // status: deleting
      if (services?.length === 1) {
        await deleteAppMutation.mutateAsync(service.appId);
      }

      closeDialog();
      notify.info(t('deleting'));

      await navigate({ to: '/' });
    },
  });

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('confirmation.title'),
      description: t('confirmation.description'),
      destructiveAction: true,
      confirmationText: service.name,
      submitText: t('confirmation.confirm'),
      onConfirm: () => deleteServiceMutation.mutateAsync(service),
    });
  };

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
          onClick={onDelete}
          disabled={service.status === 'PAUSING' || service.status === 'DELETED'}
        >
          <T id="delete" />
        </Button>
      </div>
    </div>
  );
}
