import { useMutation } from '@tanstack/react-query';

import { VolumeSnapshot } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumeSnapshots.deleteSnapshot');

type DeleteSnapshotDialogProps = {
  open: boolean;
  onClose: () => void;
  snapshot: VolumeSnapshot;
};

export function DeleteSnapshotDialog({ open, onClose, snapshot }: DeleteSnapshotDialogProps) {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const mutation = useMutation({
    ...useApiMutationFn('deleteSnapshot', {
      path: { id: snapshot.id },
    }),
    async onSuccess() {
      await invalidate('listSnapshots');
      onClose();
      notify.info(t('deleteSuccess', { name: snapshot.name }));
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
          values={{ name: <span className="font-medium text-default">{snapshot.name}</span> }}
        />
      }
      confirmationText={snapshot.name}
      submitText={<T id="confirm" />}
      onConfirm={() => mutation.mutateAsync()}
      destructiveAction
      destructiveActionMessage={<T id="destructiveActionWarning" />}
    />
  );
}
