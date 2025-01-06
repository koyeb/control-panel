import { useMutation } from '@tanstack/react-query';

import { ApiCredential, ApiCredentialType } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { createTranslate } from 'src/intl/translate';

type DeleteCredentialDialogProps = {
  type: ApiCredentialType;
  open: boolean;
  onClose: () => void;
  credential: ApiCredential;
};

export function DeleteCredentialDialog({ type, open, onClose, credential }: DeleteCredentialDialogProps) {
  const T = createTranslate(`pages.${type}Settings.apiCredential.deleteDialog`);
  const t = T.useTranslate();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('deleteApiCredential', {
      path: { id: credential.id },
    }),
    async onSuccess() {
      await invalidate('listApiCredentials');
      notify.info(t('successNotification', { name: credential.name }));
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
            name: credential.name,
            strong: (children) => <strong className="text-default">{children}</strong>,
          }}
        />
      }
      destructiveAction
      confirmationText={credential.name}
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
