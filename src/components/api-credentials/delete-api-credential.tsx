import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { createTranslate } from 'src/intl/translate';
import { ApiCredential, ApiCredentialType } from 'src/model';

import { Dialog } from '../dialog';

type DeleteCredentialDialogProps = {
  type: ApiCredentialType;
  credential: ApiCredential;
};

export function DeleteCredentialDialog({ type, credential }: DeleteCredentialDialogProps) {
  const T = createTranslate(`pages.${type}Settings.apiCredential.deleteDialog`);
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/credentials/{id}', {
      path: { id: credential.id },
    }),
    async onSuccess() {
      await invalidate('get /v1/credentials');
      notify.info(t('successNotification', { name: credential.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteApiCredential"
      resourceId={credential.id}
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
