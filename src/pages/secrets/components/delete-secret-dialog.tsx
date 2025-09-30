import { useMutation } from '@tanstack/react-query';

import { apiMutation } from 'src/api/api';
import { useInvalidateApiQuery } from 'src/api/api';
import { Secret } from 'src/api/model';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.secrets.deleteSecretDialog');

export function DeleteSecretDialog({ secret }: { secret: Secret }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/secrets/{id}', {
      path: { id: secret.id },
    }),
    async onSuccess() {
      await invalidate('get /v1/secrets');
      notify.info(t('successNotification', { name: secret.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteSecret"
      resourceId={secret.id}
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
