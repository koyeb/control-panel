import { ButtonMenuItem, MenuItem } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { closeDialog, openDialog } from 'src/components/dialog';
import { LinkMenuItem } from 'src/components/link';
import { IconEllipsis } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { App } from 'src/model';

const T = createTranslate('pages.home.apps');

export function AppActions({ app }: { app: App }) {
  const t = T.useTranslate();

  const onEdit = () => {
    openDialog('EditApp', app);
  };

  const pauseMutation = usePauseMutation();

  const onPause = () => {
    openDialog('Confirmation', {
      title: t('pause.title'),
      description: t('pause.description'),
      confirmationText: app.name,
      submitText: t('pause.confirm'),
      onConfirm: () => pauseMutation.mutateAsync(app),
    });
  };

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description'),
      destructiveAction: true,
      confirmationText: app.name,
      submitText: t('delete.confirm'),
      onConfirm: () => deleteMutation.mutateAsync(app),
    });
  };

  return (
    <ActionsMenu Icon={IconEllipsis}>
      {(withClose, onClose) => (
        <>
          <MenuItem className="text-dim hover:!bg-inherit">
            <T id="actions.label" />
          </MenuItem>

          <LinkMenuItem to="/services/new" search={{ app_id: app.id }} onClick={onClose}>
            <T id="actions.addService" />
          </LinkMenuItem>

          <LinkMenuItem to="/domains" onClick={onClose} state={{ create: true }}>
            <T id="actions.addDomain" />
          </LinkMenuItem>

          <ButtonMenuItem onClick={withClose(onEdit)}>
            <T id="actions.edit" />
          </ButtonMenuItem>

          <ButtonMenuItem onClick={withClose(onPause)}>
            <T id="actions.pauseServices" />
          </ButtonMenuItem>

          <ButtonMenuItem onClick={withClose(onDelete)}>
            <T id="actions.deleteApp" />
          </ButtonMenuItem>
        </>
      )}
    </ActionsMenu>
  );
}

function usePauseMutation() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    ...apiMutation('post /v1/apps/{id}/pause', (app: App) => ({
      path: { id: app.id },
    })),
    onSuccess() {
      void invalidate('get /v1/apps');
      notify.info(t('pause.success'));
      closeDialog();
    },
  });
}

function useDeleteMutation() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    ...apiMutation('delete /v1/apps/{id}', (app: App) => ({
      path: { id: app.id },
    })),
    async onSuccess() {
      await invalidate('get /v1/apps');
      notify.info(t('delete.success'));
      closeDialog();
    },
  });
}
