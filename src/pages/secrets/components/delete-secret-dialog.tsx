import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { closeDialog, useDialogContext } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.secrets.deleteSecretDialog');

export function DeleteSecretDialog({ onDeleted }: { onDeleted?: () => void }) {
  const t = T.useTranslate();
  const secret = useDialogContext<'ConfirmDeleteSecret'>();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/secrets/{id}', {
      path: { id: secret?.id as string },
    }),
    async onSuccess() {
      await invalidate('get /v1/secrets');
      notify.info(t('successNotification', { name: secret?.name }));
      onDeleted?.();
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteSecret"
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
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
