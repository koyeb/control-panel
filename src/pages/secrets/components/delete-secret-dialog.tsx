import { useMutation } from '@tanstack/react-query';

import { Secret } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.secrets.deleteSecretDialog');

type DeleteSecretDialogProps = {
  open: boolean;
  onClose: () => void;
  secret: Secret;
};

export function DeleteSecretDialog({ open, onClose, secret }: DeleteSecretDialogProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('deleteSecret', {
      path: { id: secret.id },
    }),
    async onSuccess() {
      await invalidate('listSecrets');
      notify.info(t('successNotification', { name: secret.name }));
      onClose();
    },
  });

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
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
