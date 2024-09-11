import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { SectionHeader } from 'src/components/section-header';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('account.deactivateOrganization');

export function DeactivateOrganization() {
  const organization = useOrganization();
  const t = T.useTranslate();

  const [dialogOpen, setDialogOpen] = useState(false);

  const requestDeactivation = useMutation({
    ...useApiMutationFn('deactivateOrganization', {
      path: { id: organization.id },
    }),
    onSuccess() {
      setDialogOpen(false);
      notify.info(t('deactivationRequestSuccessNotification'));
    },
  });

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
