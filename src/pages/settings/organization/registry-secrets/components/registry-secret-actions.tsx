import { ButtonMenuItem } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { closeDialog, openDialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { RegistrySecret, Secret } from 'src/model';

const T = createTranslate('pages.organizationSettings.registrySecrets');

export function RegistrySecretActions({ secret }: { secret: RegistrySecret }) {
  const t = T.useTranslate();

  const onEdit = () => {
    openDialog('EditRegistrySecret', secret);
  };

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('deleteDialog.title'),
      description: t('deleteDialog.description', { name: secret.name }),
      confirmationText: secret.name,
      submitText: t('deleteDialog.confirm'),
      onConfirm: () => deleteMutation.mutateAsync(secret),
    });
  };

  return (
    <ActionsMenu>
      {(withClose) => (
        <>
          <ButtonMenuItem onClick={withClose(onEdit)}>
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

function useDeleteMutation() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    ...apiMutation('delete /v1/secrets/{id}', (secret: Secret) => ({
      path: { id: secret.id },
    })),
    async onSuccess(_, secret) {
      await invalidate('get /v1/secrets');
      notify.info(t('deleteDialog.successNotification', { name: secret.name }));
      closeDialog();
    },
  });
}
