import { useMutation } from '@tanstack/react-query';

import { Volume } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.deleteVolume');

type DeleteVolumeDialogProps = {
  open: boolean;
  onClose: () => void;
  volume: Volume;
};

export function DeleteVolumeDialog({ open, onClose, volume }: DeleteVolumeDialogProps) {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const mutation = useMutation({
    ...useApiMutationFn('deleteVolume', {
      path: { id: volume.id },
    }),
    async onSuccess() {
      await invalidate('listVolumes');
      onClose();
      notify.info(t('deleteSuccess', { name: volume.name }));
    },
  });

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={{ name: <span className="font-medium text-default">{volume.name}</span> }}
        />
      }
      confirmationText={volume.name}
      submitText={<T id="confirm" />}
      onConfirm={() => mutation.mutateAsync()}
      destructiveAction
      destructiveActionMessage={<T id="destructiveActionWarning" />}
    />
  );
}
