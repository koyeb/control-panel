import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('pages.service.settings.pause');

type PauseServiceCardProps = {
  service: Service;
};

export function PauseServiceCard({ service }: PauseServiceCardProps) {
  const navigate = useNavigate();
  const t = T.useTranslate();

  const pause = useMutation({
    ...apiMutation('post /v1/services/{id}/pause', (service: Service) => ({
      path: { id: service.id },
    })),
    async onSuccess(_, service) {
      closeDialog();
      await navigate({ to: '/services/$serviceId', params: { serviceId: service.id } });
      notify.info(t('pausing'));
    },
  });

  const onPause = () => {
    openDialog('Confirmation', {
      title: t('confirmation.title'),
      description: t('confirmation.description'),
      confirmationText: service.name,
      submitText: t('confirmation.confirm'),
      onConfirm: () => pause.mutateAsync(service),
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
          color="gray"
          onClick={() => openDialog('ResumeService', service)}
          disabled={service.status !== 'PAUSED'}
        >
          <T id="resume" />
        </Button>

        <Button
          color="orange"
          onClick={onPause}
          disabled={service.status === 'PAUSING' || service.status === 'PAUSED'}
        >
          <T id="pause" />
        </Button>
      </div>
    </div>
  );
}
