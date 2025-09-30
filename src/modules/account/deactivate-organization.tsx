import { apiMutation } from 'src/api/api';
import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { useState } from 'react';
import { useOrganization } from 'src/api/hooks/session';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { SectionHeader } from 'src/components/section-header';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.account.deactivateOrganization');

export function DeactivateOrganization() {
  const organization = useOrganization();
  const t = T.useTranslate();

  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const [skipConfirmation, setSkipConfirmation] = useState(false);

  const requestDeactivation = useMutation({
    ...apiMutation('post /v1/organizations/{id}/deactivate', {
      path: { id: organization.id },
      body: { skip_confirmation: skipConfirmation },
    }),
    onSuccess() {
      closeDialog();
      notify.info(t('deactivationRequestSuccessNotification'));
    },
  });

  return (
    <section className="card">
      <div className="row items-center gap-4 p-3">
        <SectionHeader title={<T id="title" />} description={<T id="description" />} className="flex-1" />

        <Button
          color="orange"
          onClick={() => openDialog('ConfirmDeactivateOrganization')}
          disabled={
            requestDeactivation.isPending ||
            requestDeactivation.isSuccess ||
            organization.status === 'DEACTIVATING'
          }
        >
          <T id="deactivate" />
        </Button>
      </div>

      {organization.status === 'DEACTIVATING' && (
        <footer className="text-xs text-dim">
          <T id="deactivating" />
        </footer>
      )}

      <ConfirmationDialog
        id="ConfirmDeactivateOrganization"
        title={<T id="title" />}
        description={<T id="description" />}
        confirmationText={organization.name}
        submitText={<T id="deactivate" />}
        submitColor="orange"
        onConfirm={requestDeactivation.mutateAsync}
        onAutofill={() => setSkipConfirmation(true)}
      />
    </section>
  );
}
