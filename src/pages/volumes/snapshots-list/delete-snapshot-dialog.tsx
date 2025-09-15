import { useMutation } from '@tanstack/react-query';

import { VolumeSnapshot } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.snapshotsList.deleteDialog');

export function DeleteSnapshotDialog({ snapshot }: { snapshot: VolumeSnapshot }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('deleteSnapshot', {
      path: { id: snapshot.id },
    }),
    async onSuccess() {
      await invalidate('listSnapshots');
      notify.info(t('deleteSuccess', { name: snapshot.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteSnapshot"
      resourceId={snapshot.id}
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
