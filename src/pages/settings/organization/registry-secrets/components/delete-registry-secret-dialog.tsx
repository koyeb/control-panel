import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { closeDialog, useDialogContext } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { Secret } from 'src/model';

const T = createTranslate('pages.organizationSettings.registrySecrets.deleteDialog');

export function DeleteRegistrySecretDialog() {
  const t = T.useTranslate();
  const secret = useDialogContext<'ConfirmDeleteRegistrySecret'>();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/secrets/{id}', (secret: Secret) => ({
      path: { id: secret.id },
    })),
    async onSuccess(_, { name }) {
      await invalidate('get /v1/secrets');
      notify.info(t('successNotification', { name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteRegistrySecret"
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={{
            name: secret?.name,
            strong: (children) => <strong className="text-default">{children}</strong>,
          }}
        />
      }
      confirmationText={secret?.name ?? ''}
      onConfirm={() => mutation.mutateAsync(secret!)}
      submitText={<T id="confirm" />}
    />
  );
}
