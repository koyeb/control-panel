import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { createTranslate } from 'src/intl/translate';
import { ApiCredentialType } from 'src/model';

import { closeDialog, useDialogContext } from '../dialog';

type DeleteCredentialDialogProps = {
  type: ApiCredentialType;
};

export function DeleteCredentialDialog({ type }: DeleteCredentialDialogProps) {
  const T = createTranslate(`pages.${type}Settings.apiCredential.deleteDialog`);
  const t = T.useTranslate();
  const credential = useDialogContext<'ConfirmDeleteApiCredential'>();

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/credentials/{id}', {
      path: { id: credential?.id as string },
    }),
    async onSuccess() {
      await invalidate('get /v1/credentials');
      notify.info(t('successNotification', { name: credential?.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteApiCredential"
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={{
            name: credential?.name,
            strong: (children) => <strong className="text-default">{children}</strong>,
          }}
        />
      }
      destructiveAction
      confirmationText={credential?.name ?? ''}
      onConfirm={mutation.mutateAsync}
      submitText={<T id="confirm" />}
    />
  );
}
