import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { Service } from 'src/api/model';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.settings.deleteService');

type DeleteServiceCardProps = {
  service: Service;
};

export function DeleteServiceCard({ service }: DeleteServiceCardProps) {
  const t = T.useTranslate();
  const { token } = useToken();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutateAsync: deleteService } = useMutation({
    mutationFn: async () => {
      await api.deleteService({
        token,
        path: { id: service.id },
      });

      const { services } = await api.listServices({
        token,
        query: { app_id: service.appId },
      });

      if (services?.length === 1) {
        await api.deleteApp({
          token,
          path: { id: service.appId },
        });
      }
    },
    onSuccess: () => {
      setDialogOpen(false);
      navigate(routes.home());
      notify.info(t('deleting'));
    },
  });

  return (
    <div className="card row col-start-1 items-center gap-4 p-3">
      <div className="col flex-1 gap-2">
        <strong>
          <T id="title" />
        </strong>

        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <div className="row ml-auto gap-4">
        <Button
          color="red"
          onClick={() => setDialogOpen(true)}
          disabled={service.status === 'pausing' || service.status === 'deleted'}
        >
          <T id="delete" />
        </Button>
      </div>

      <ConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
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
