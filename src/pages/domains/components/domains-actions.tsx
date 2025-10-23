import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { ActionsMenu, ButtonMenuItem } from 'src/components/dropdown-menu';
import { createTranslate } from 'src/intl/translate';
import { Domain } from 'src/model';

const T = createTranslate('pages.domains');

export function DomainActions({ domain }: { domain: Domain }) {
  const t = T.useTranslate();

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description', {
        domainName: domain.name,
        strong: (children) => <span className="text-default">{children}</span>,
      }),
      destructiveAction: true,
      confirmationText: domain.name,
      submitText: t('delete.confirm'),
      onConfirm: () => deleteMutation.mutateAsync(domain),
    });
  };

  return (
    <ActionsMenu>
      <ButtonMenuItem disabled={domain.status === 'DELETING'} onClick={onDelete}>
        <T id="list.actions.delete" />
      </ButtonMenuItem>
    </ActionsMenu>
  );
}

function useDeleteMutation() {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  return useMutation({
    ...apiMutation('delete /v1/domains/{id}', (domain: Domain) => ({
      path: { id: domain.id },
    })),
    async onSuccess(_, domain) {
      await invalidate('get /v1/domains');
      notify.success(t('delete.successNotification', { domainName: domain.name }));
      closeDialog();
    },
  });
}
