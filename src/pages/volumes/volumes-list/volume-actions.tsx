import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { ActionsMenu, ButtonMenuItem } from 'src/components/dropdown-menu';
import { IconPen, IconPlus, IconTrash } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { Volume } from 'src/model';

const T = createTranslate('pages.volumes');

export function VolumeActions({ volume }: { volume: Volume }) {
  const t = T.useTranslate();

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description', { name: volume.name }),
      destructiveAction: true,
      destructiveActionMessage: t('delete.destructiveActionWarning'),
      confirmationText: volume.name,
      submitText: t('delete.confirm'),
      onConfirm: () => deleteMutation.mutateAsync(volume),
    });
  };

  return (
    <ActionsMenu>
      <ButtonMenuItem onClick={() => openDialog('EditVolume', volume)}>
        <IconPen className="size-4" />
        <T id="list.actions.edit" />
      </ButtonMenuItem>

      <ButtonMenuItem onClick={() => openDialog('CreateSnapshotFromVolume', volume)}>
        <IconPlus className="size-4" />
        <T id="list.actions.createSnapshot" />
      </ButtonMenuItem>

      <ButtonMenuItem onClick={onDelete}>
        <IconTrash className="size-4" />
        <T id="list.actions.delete" />
      </ButtonMenuItem>
    </ActionsMenu>
  );
}

function useDeleteMutation() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    ...apiMutation('delete /v1/volumes/{id}', (volume: Volume) => ({
      path: { id: volume.id },
    })),
    async onSuccess(_, volume) {
      await invalidate('get /v1/volumes');
      notify.info(t('delete.success', { name: volume.name }));
      closeDialog();
    },
  });
}
