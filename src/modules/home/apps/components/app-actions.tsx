import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiMutation } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { ActionsMenu, ButtonMenuItem, LabelMenuItem, LinkMenuItem } from 'src/components/dropdown-menu';
import { createTranslate } from 'src/intl/translate';
import { App } from 'src/model';

const T = createTranslate('pages.home.apps');

export function AppActions({ app }: { app: App }) {
  const t = T.useTranslate();

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
    <ActionsMenu>
      <LabelMenuItem>
        <T id="actions.label" />
      </LabelMenuItem>

      <LinkMenuItem to="/services/new" search={{ app_id: app.id }}>
        <T id="actions.addService" />
      </LinkMenuItem>

      <LinkMenuItem to="/domains">
        <T id="actions.addDomain" />
      </LinkMenuItem>

      <ButtonMenuItem onClick={() => openDialog('EditApp', app)}>
        <T id="actions.edit" />
      </ButtonMenuItem>

      <ButtonMenuItem onClick={onPause}>
        <T id="actions.pauseServices" />
      </ButtonMenuItem>

      <ButtonMenuItem onClick={onDelete}>
        <T id="actions.deleteApp" />
      </ButtonMenuItem>
    </ActionsMenu>
  );
}

function usePauseMutation() {
  const t = T.useTranslate();
  const queryClient = useQueryClient();

  return useMutation({
    ...apiMutation('post /v1/apps/{id}/pause', (app: App) => ({
      path: { id: app.id },
    })),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['listAppsFull'] });
      notify.info(t('pause.success'));
      closeDialog();
    },
  });
}

function useDeleteMutation() {
  const t = T.useTranslate();
  const queryClient = useQueryClient();

  return useMutation({
    ...apiMutation('delete /v1/apps/{id}', (app: App) => ({
      path: { id: app.id },
    })),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['listAppsFull'] });
      notify.info(t('delete.success'));
      closeDialog();
    },
  });
}
