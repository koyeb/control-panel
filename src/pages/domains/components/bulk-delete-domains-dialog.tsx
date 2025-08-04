import { useMutation } from '@tanstack/react-query';

import { Domain } from 'src/api/model';
import { useApi, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.domains.bulkDelete');

type BulkDeleteDomainsDialogProps = {
  domains: Set<Domain>;
  onDeleted: () => void;
};

export function BulkDeleteDomainsDialog({ domains, onDeleted }: BulkDeleteDomainsDialogProps) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const api = useApi();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    async mutationFn(domains: Domain[]) {
      return Promise.allSettled(domains.map((domain) => api.deleteDomain({ path: { id: domain.id } })));
    },
    async onSuccess(result) {
      await invalidate('listDomains');

      const fulfilled = result.filter((result) => result.status === 'fulfilled');
      notify.success(t('successNotification', { count: fulfilled.length }));

      closeDialog();
      onDeleted();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmBulkDeleteDomains"
      title={<T id="title" />}
      description={<T id="description" values={{ count: domains.size }} />}
      confirmationText={t('confirmationText')}
      submitText={<T id="cta" />}
      onConfirm={() => mutation.mutateAsync(Array.from(domains.values()))}
    />
  );
}
