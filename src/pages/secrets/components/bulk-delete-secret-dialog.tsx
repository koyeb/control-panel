import { useMutation } from '@tanstack/react-query';

import { api } from 'src/api/api';
import { Secret } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useAuth } from 'src/application/authentication';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.secrets.bulkDelete');

type BulkDeleteSecretsDialogProps = {
  secrets: Secret[];
  onDeleted: () => void;
};

export function BulkDeleteSecretsDialog({ secrets, onDeleted }: BulkDeleteSecretsDialogProps) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const { token } = useAuth();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    async mutationFn(secrets: Secret[]) {
      return Promise.allSettled(
        secrets.map((secret) => api.deleteSecret({ token, path: { id: secret.id } })),
      );
    },
    async onSuccess(result) {
      await invalidate('listSecrets');

      const fulfilled = result.filter((result) => result.status === 'fulfilled');
      notify.success(t('successNotification', { count: fulfilled.length }));

      closeDialog();
      onDeleted();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmBulkDeleteSecrets"
      title={<T id="title" />}
      description={<T id="description" values={{ count: secrets.length }} />}
      confirmationText={t('confirmationText')}
      submitText={<T id="cta" />}
      onConfirm={() => mutation.mutateAsync(secrets)}
    />
  );
}
