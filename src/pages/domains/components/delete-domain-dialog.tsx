import { useMutation } from '@tanstack/react-query';

import { Domain } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.domains.deleteDialog');

export type DeleteDomainDialogProps = {
  open: boolean;
  onClose: () => void;
  domain: Domain;
};

export function DeleteDomainDialog({ open, onClose, domain }: DeleteDomainDialogProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const { mutateAsync: deleteDomain } = useMutation({
    ...useApiMutationFn('deleteDomain', {
      path: { id: domain.id },
    }),
    async onSuccess() {
      await invalidate('listDomains');
      notify.success(t('successNotification', { domainName: domain.name }));
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
