import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { ActionsMenu, ButtonMenuItem, LinkMenuItem } from 'src/components/dropdown-menu';
import { Tooltip } from 'src/components/tooltip';
import { IconPen, IconPlus, IconTrash } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { VolumeSnapshot } from 'src/model';

const T = createTranslate('pages.snapshots');

export function SnapshotActions({ snapshot }: { snapshot: VolumeSnapshot }) {
  const t = T.useTranslate();

  const canCreate = snapshot.status === 'AVAILABLE' && snapshot.type === 'REMOTE';

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description', { name: snapshot.name }),
      destructiveAction: true,
      destructiveActionMessage: t('delete.destructiveActionWarning'),
      confirmationText: snapshot.name,
      submitText: t('delete.confirm'),
      onConfirm: () => deleteMutation.mutateAsync(snapshot),
    });
  };

  return (
    <ActionsMenu>
      <Tooltip
        forceDesktop
        content={canCreate ? undefined : <T id="list.actions.cannotCreateVolume" />}
        aria-disabled={!canCreate}
        trigger={(props) => (
          <LinkMenuItem {...props} to="/volumes/new" search={{ snapshot: snapshot.id }} disabled={!canCreate}>
            <IconPlus className="size-4" />
            <T id="list.actions.createVolume" />
          </LinkMenuItem>
        )}
      />

      <ButtonMenuItem onClick={() => openDialog('EditSnapshot', snapshot)}>
        <IconPen className="size-4" />
        <T id="list.actions.update" />
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
    ...apiMutation('delete /v1/snapshots/{id}', (snapshot: VolumeSnapshot) => ({
      path: { id: snapshot.id },
    })),
    async onSuccess(_, snapshot) {
      await invalidate('get /v1/snapshots');
      notify.info(t('delete.success', { name: snapshot.name }));
      closeDialog();
    },
  });
}
