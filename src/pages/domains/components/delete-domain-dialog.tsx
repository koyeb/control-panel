import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { closeDialog, useDialogContext } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.domains.deleteDialog');

export function DeleteDomainDialog() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const domain = useDialogContext<'ConfirmDeleteDomain'>();

  const { mutateAsync: deleteDomain } = useMutation({
    ...apiMutation('delete /v1/domains/{id}', {
      path: { id: domain?.id as string },
    }),
    async onSuccess() {
      await invalidate('get /v1/domains');
      notify.success(t('successNotification', { domainName: domain?.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteDomain"
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={{
            domainName: domain?.name,
            strong: (children) => <span className="text-default">{children}</span>,
          }}
        />
      }
      destructiveAction
      confirmationText={domain?.name ?? ''}
      submitText={<T id="confirm" />}
      onConfirm={deleteDomain}
    />
  );
}
