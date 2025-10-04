import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { closeDialog, useDialogContext } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.volumesList.deleteDialog');

export function DeleteVolumeDialog() {
  const t = T.useTranslate();
  const volume = useDialogContext<'ConfirmDeleteVolume'>();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/volumes/{id}', {
      path: { id: volume?.id as string },
    }),
    async onSuccess() {
      await invalidate('get /v1/volumes');
      notify.info(t('deleteSuccess', { name: volume?.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteVolume"
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={{ name: <span className="font-medium text-default">{volume?.name}</span> }}
        />
      }
      confirmationText={volume?.name ?? ''}
      submitText={<T id="confirm" />}
      onConfirm={() => mutation.mutateAsync()}
      destructiveAction
      destructiveActionMessage={<T id="destructiveActionWarning" />}
    />
  );
}
