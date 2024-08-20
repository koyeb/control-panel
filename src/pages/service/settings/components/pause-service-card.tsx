import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { Service } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { useNavigate } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.service.settings');

type PauseServiceCardProps = {
  service: Service;
};

export function PauseServiceCard({ service }: PauseServiceCardProps) {
  const navigate = useNavigate();
  const t = T.useTranslate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutateAsync: pause } = useMutation({
    ...useApiMutationFn('pauseService', {
      path: { id: service.id },
    }),
    onSuccess: () => {
      setDialogOpen(false);
      navigate(routes.service.overview(service.id));
      notify.info(t('pauseServiceCard.pausing'));
    },
  });

  const { mutate: resume, isPending: isResuming } = useMutation({
    ...useApiMutationFn('resumeService', {
      path: { id: service.id },
    }),
    onSuccess: () => {
      setDialogOpen(false);
      navigate(routes.service.overview(service.id));
      notify.info(t('pauseServiceCard.resuming'));
    },
  });

  return (
    <div className="card row items-center gap-4 p-3">
      <div className="col flex-1 gap-2">
        <strong>
          <T id="pauseServiceCard.title" />
        </strong>

        <p className="text-dim">
          <T id="pauseServiceCard.description" />
        </p>
      </div>

      <div className="row ml-auto gap-4">
        <Button
          color="gray"
          onClick={() => resume()}
          disabled={service.status !== 'paused'}
          loading={isResuming}
        >
          <T id="pauseServiceCard.resume" />
        </Button>

        <Button
          color="orange"
          onClick={() => setDialogOpen(true)}
          disabled={service.status === 'pausing' || service.status === 'paused'}
        >
          <T id="pauseServiceCard.pause" />
        </Button>
      </div>

      <ConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={<T id="pauseServiceCard.confirmationDialog.title" />}
        description={<T id="pauseServiceCard.confirmationDialog.description" />}
        confirmationText={service.name}
        submitText={<T id="pauseServiceCard.confirmationDialog.confirm" />}
        onConfirm={pause}
      />
    </div>
  );
}
