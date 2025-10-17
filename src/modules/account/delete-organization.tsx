import { Button } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiMutation, apiQuery, useOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { QueryError } from 'src/components/query-error';
import { SectionHeader } from 'src/components/section-header';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { Organization } from 'src/model';

const T = createTranslate('modules.account.deleteOrganization');

export function DeleteOrganization() {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const organization = useOrganization();

  const unpaidInvoicesQuery = useQuery({
    ...apiQuery('get /v1/billing/has_unpaid_invoices', {}),
    enabled: organization?.currentSubscriptionId !== undefined,
    select: (result) => result.has_unpaid_invoices!,
  });

  const deleteOrganization = useMutation({
    ...apiMutation('delete /v1/organizations/{id}', (organization: Organization) => ({
      path: { id: organization.id },
    })),
    async onSuccess(_, organization) {
      await navigate({ to: '/', reloadDocument: true });
      notify.info(t('success', { organizationName: organization.name }));
    },
  });

  const isDeactivated = organization?.status === 'DEACTIVATED';
  const hasUnpaidInvoices = unpaidInvoicesQuery.data;
  const canDeleteOrganization = isDeactivated && !hasUnpaidInvoices;

  const footerMessage = useFooterMessage({
    unpaidInvoicesPending: unpaidInvoicesQuery.isLoading,
    isDeactivated,
  });

  if (unpaidInvoicesQuery.isError) {
    return <QueryError error={unpaidInvoicesQuery.error} />;
  }

  return (
    <section className="card">
      <div className="row items-center gap-4 p-3">
        <SectionHeader title={<T id="title" />} description={<T id="description" />} className="flex-1" />

        <Button
          color="red"
          loading={deleteOrganization.isPending}
          disabled={!canDeleteOrganization}
          onClick={() => deleteOrganization.mutate(organization!)}
        >
          <T id="delete" />
        </Button>
      </div>

      {footerMessage && <footer className="text-xs text-dim">{footerMessage}</footer>}
    </section>
  );
}

type FooterMessageProps = {
  unpaidInvoicesPending: boolean;
  isDeactivated: boolean;
};

function useFooterMessage({ unpaidInvoicesPending, isDeactivated }: FooterMessageProps) {
  if (unpaidInvoicesPending) {
    return <T id="unpaidInvoicesPending" />;
  }

  if (!isDeactivated) {
    return <T id="mustBeDeactivated" />;
  }

  return null;
}
