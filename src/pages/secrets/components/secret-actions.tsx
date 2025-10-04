import { ButtonMenuItem } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { closeDialog, openDialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { Secret } from 'src/model';

const T = createTranslate('pages.secrets');

export function SecretActions({ secret, onDeleted }: { secret: Secret; onDeleted: () => void }) {
  const t = T.useTranslate();

  const deleteMutation = useDeleteMutation(onDeleted);

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description', { name: secret.name }),
      confirmationText: secret.name,
      submitText: t('delete.confirm'),
      onConfirm: () => deleteMutation.mutateAsync(secret),
    });
  };

  return (
    <ActionsMenu>
      {(withClose) => (
        <>
          <ButtonMenuItem onClick={withClose(() => openDialog('EditSecret', secret))}>
            <T id="list.actions.edit" />
          </ButtonMenuItem>
          <ButtonMenuItem onClick={withClose(onDelete)}>
            <T id="list.actions.delete" />
          </ButtonMenuItem>
        </>
      )}
    </ActionsMenu>
  );
}

function useDeleteMutation(onDeleted: () => void) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    ...apiMutation('delete /v1/secrets/{id}', (secret: Secret) => ({
      path: { id: secret.id },
    })),
    async onSuccess(_, secret) {
      await invalidate('get /v1/secrets');
      notify.info(t('delete.successNotification', { name: secret.name }));
      closeDialog();
      onDeleted();
    },
  });
}
