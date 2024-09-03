import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { SectionHeader } from 'src/components/section-header';
import { useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('account.deactivateOrganization');

export function DeactivateOrganization() {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationId, setConfirmationId] = useSearchParam('deactivate-organization');

  const requestDeactivation = useMutation({
    ...useApiMutationFn('deactivateOrganization', {
      path: { id: organization.id },
    }),
    onSuccess() {
      setDialogOpen(false);
      notify.info(t('deactivationRequestSuccessNotification'));
    },
  });

  const confirmDeactivation = useMutation({
    ...useApiMutationFn('organizationConfirmation', (confirmationId: string) => ({
      path: { id: confirmationId },
    })),
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      setConfirmationId(null);
      notify.info(t('deactivationSuccessNotification'));
    },
  });

  useEffect(() => {
    if (confirmationId !== null && confirmDeactivation.isIdle) {
      confirmDeactivation.mutate(confirmationId);
    }
  }, [confirmationId, confirmDeactivation]);

  return (
    <section className="card">
      <div className="row items-center gap-4 p-3">
        <SectionHeader title={<T id="title" />} description={<T id="description" />} className="flex-1" />

        <Button
          color="orange"
          onClick={() => setDialogOpen(true)}
          disabled={
            requestDeactivation.isPending ||
            requestDeactivation.isSuccess ||
            organization.status === 'deactivating'
          }
        >
          <T id="deactivate" />
        </Button>
      </div>

      {organization.status === 'deactivating' && (
        <footer className="text-xs text-dim">
          <T id="deactivating" />
        </footer>
      )}

      <ConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={<T id="title" />}
        description={<T id="description" />}
        confirmationText={organization.name}
        submitText={<T id="deactivate" />}
        submitColor="orange"
        onConfirm={requestDeactivation.mutateAsync}
      />
    </section>
  );
}
