import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { Service } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.settings.pauseService');

type PauseServiceCardProps = {
  service: Service;
};

export function PauseServiceCard({ service }: PauseServiceCardProps) {
  const navigate = useNavigate();
  const t = T.useTranslate();
  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const { mutateAsync: pause } = useMutation({
    ...useApiMutationFn('pauseService', {
      path: { id: service.id },
    }),
    onSuccess: () => {
      closeDialog();
      navigate({ to: '/services/$serviceId', params: { serviceId: service.id } });
      notify.info(t('pausing'));
    },
  });

  const { mutate: resume, isPending: isResuming } = useMutation({
    ...useApiMutationFn('resumeService', {
      path: { id: service.id },
    }),
    onSuccess: () => {
      closeDialog();
      navigate({ to: '/services/$serviceId', params: { serviceId: service.id } });
      notify.info(t('resuming'));
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
          color="gray"
          onClick={() => resume()}
          disabled={service.status !== 'PAUSED'}
          loading={isResuming}
        >
          <T id="resume" />
        </Button>

        <Button
          color="orange"
          onClick={() => openDialog('ConfirmPauseService', { resourceId: service.id })}
          disabled={service.status === 'PAUSING' || service.status === 'PAUSED'}
        >
          <T id="pause" />
        </Button>
      </div>

      <ConfirmationDialog
        id="ConfirmPauseService"
        resourceId={service.id}
        title={<T id="confirmationDialog.title" />}
        description={<T id="confirmationDialog.description" />}
        confirmationText={service.name}
        submitText={<T id="confirmationDialog.confirm" />}
        onConfirm={pause}
      />
    </div>
  );
}
