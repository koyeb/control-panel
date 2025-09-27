import { Button } from '@koyeb/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiQuery, getApi, useOrganization, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { setToken } from 'src/application/token';
import { QueryError } from 'src/components/query-error';
import { SectionHeader } from 'src/components/section-header';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.account.deleteOrganization');

export function DeleteOrganization() {
  const t = T.useTranslate();

  const user = useUser();
  const organization = useOrganization();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const unpaidInvoicesQuery = useQuery({
    ...apiQuery('get /v1/billing/has_unpaid_invoices', {}),
    enabled: organization?.currentSubscriptionId !== undefined,
    select: (result) => result.has_unpaid_invoices!,
  });

  const deleteOrganization = useMutation({
    async mutationFn() {
      const api = getApi();

      const { members } = await api('get /v1/organization_members', {
        query: { user_id: user!.id },
      });

      const [otherOrganizationId] = members!
        .map((member) => member.organization_id!)
        .filter((organizationId) => organizationId !== organization?.id);

      let result: string;

      if (otherOrganizationId) {
        const { token: newToken } = await api('post /v1/organizations/{id}/switch', {
          path: { id: otherOrganizationId },
          header: {},
        });

        result = newToken!.id!;
      } else {
        const { token: newToken } = await api('post /v1/account/session', {});

        result = newToken!.id!;
      }

      await api('delete /v1/organizations/{id}', {
        path: { id: organization!.id },
      });

      return result;
    },
    async onSuccess(token) {
      await setToken(token, { queryClient });
      await navigate({ to: '/' });
      notify.info(t('successNotification', { organizationName: organization?.name }));
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
          onClick={() => deleteOrganization.mutate()}
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
