import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { Volume } from 'src/model';

const T = createTranslate('pages.volumes.volumesList.deleteDialog');

export function DeleteVolumeDialog({ volume }: { volume: Volume }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/volumes/{id}', {
      path: { id: volume.id },
    }),
    async onSuccess() {
      await invalidate('get /v1/volumes');
      notify.info(t('deleteSuccess', { name: volume.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteVolume"
      resourceId={volume.id}
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
