import { useMutation } from '@tanstack/react-query';

import { Domain } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.domains.deleteDialog');

export function DeleteDomainDialog({ domain }: { domain: Domain }) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const closeDialog = Dialog.useClose();

  const { mutateAsync: deleteDomain } = useMutation({
    ...useApiMutationFn('deleteDomain', {
      path: { id: domain.id },
    }),
    async onSuccess() {
      await invalidate('listDomains');
      notify.success(t('successNotification', { domainName: domain.name }));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteDomain"
      resourceId={domain.id}
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={{
            domainName: domain.name,
            strong: (children) => <span className="text-default">{children}</span>,
          }}
        />
      }
      destructiveAction
      confirmationText={domain.name}
      submitText={<T id="confirm" />}
      onConfirm={deleteDomain}
    />
  );
}
