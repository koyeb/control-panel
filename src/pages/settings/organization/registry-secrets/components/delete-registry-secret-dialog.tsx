import { useMutation } from '@tanstack/react-query';

import { RegistrySecret } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.registrySecrets.deleteDialog');

export function DeleteRegistrySecretDialog({ secret }: { secret: RegistrySecret }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('deleteSecret', {
      path: { id: secret.id },
    }),
    async onSuccess() {
      await invalidate('listSecrets');
      notify.info(t('successNotification', { name: secret.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id={`ConfirmDeleteRegistrySecret-${secret.id}`}
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={{
            name: secret.name,
            strong: (children) => <strong className="text-default">{children}</strong>,
          }}
        />
      }
      confirmationText={secret.name}
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
