import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { apiMutation, useOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { SectionHeader } from 'src/components/section-header';
import { createTranslate } from 'src/intl/translate';
import { Organization } from 'src/model';

const T = createTranslate('modules.account.deactivateOrganization');

export function DeactivateOrganization() {
  const organization = useOrganization();
  const t = T.useTranslate();

  const [skipConfirmation, setSkipConfirmation] = useState(false);

  const requestDeactivation = useMutation({
    ...apiMutation('post /v1/organizations/{id}/deactivate', (organization: Organization) => ({
      path: { id: organization.id },
      body: { skip_confirmation: skipConfirmation },
    })),
    onSuccess() {
      closeDialog();
      notify.info(t('success'));
    },
  });

  const onDeactivate = () => {
    openDialog('Confirmation', {
      title: t('title'),
      description: t('description'),
      confirmationText: organization?.name ?? '',
      submitText: t('deactivate'),
      submitColor: 'orange',
      onAutofill: () => setSkipConfirmation(true),
      onConfirm: () => requestDeactivation.mutateAsync(organization!),
    });
  };

  return (
    <section className="card">
      <div className="row items-center gap-4 p-3">
        <SectionHeader title={<T id="title" />} description={<T id="description" />} className="flex-1" />

        <Button
          color="orange"
          onClick={onDeactivate}
          disabled={
            requestDeactivation.isPending ||
            requestDeactivation.isSuccess ||
            organization?.status === 'DEACTIVATING'
          }
        >
          <T id="deactivate" />
        </Button>
      </div>

      {organization?.status === 'DEACTIVATING' && (
        <footer className="text-xs text-dim">
          <T id="deactivating" />
        </footer>
      )}
    </section>
  );
}
