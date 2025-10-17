import { ButtonMenuItem } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { closeDialog, openDialog } from 'src/components/dialog';
import { Tooltip } from 'src/components/tooltip';
import { useNavigate } from 'src/hooks/router';
import { IconPen, IconPlus, IconTrash } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { VolumeSnapshot } from 'src/model';

const T = createTranslate('pages.snapshots');

export function SnapshotActions({ snapshot }: { snapshot: VolumeSnapshot }) {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const canCreate = snapshot.status === 'AVAILABLE' && snapshot.type === 'REMOTE';

  const onCreateVolume = () => {
    void navigate({ to: '/volumes/new', search: { snapshot: snapshot.id } });
  };

  const onEdit = () => {
    openDialog('EditSnapshot', snapshot);
  };

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
      {(withClose) => (
        <>
          <Tooltip
            forceDesktop
            content={canCreate ? undefined : <T id="list.actions.cannotCreateVolume" />}
            trigger={(props) => (
              <ButtonMenuItem {...props} disabled={!canCreate} onClick={withClose(onCreateVolume)}>
                <IconPlus className="size-4" />
                <T id="list.actions.createVolume" />
              </ButtonMenuItem>
            )}
          />

          <ButtonMenuItem onClick={withClose(onEdit)}>
            <IconPen className="size-4" />
            <T id="list.actions.update" />
          </ButtonMenuItem>

          <ButtonMenuItem onClick={withClose(onDelete)}>
            <IconTrash className="size-4" />
            <T id="list.actions.delete" />
          </ButtonMenuItem>
        </>
      )}
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
