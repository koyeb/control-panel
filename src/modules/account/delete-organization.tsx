import { Button } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from 'src/api/api';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { useApiQueryFn } from 'src/api/use-api';
import { useSetToken } from 'src/application/authentication';
import { notify } from 'src/application/notify';
import { QueryError } from 'src/components/query-error';
import { SectionHeader } from 'src/components/section-header';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.account.deleteOrganization');

export function DeleteOrganization() {
  const t = T.useTranslate();

  const user = useUser();
  const organization = useOrganization();

  const setToken = useSetToken();
  const navigate = useNavigate();

  const unpaidInvoicesQuery = useQuery({
    ...useApiQueryFn('hasUnpaidInvoices'),
    enabled: organization.currentSubscriptionId !== undefined,
    select: (result) => result.has_unpaid_invoices!,
  });

  const deleteOrganization = useMutation({
    async mutationFn() {
      const { members } = await api.listOrganizationMembers({
        query: { user_id: user.id },
      });

      const [otherOrganizationId] = members!
        .map((member) => member.organization_id!)
        .filter((organizationId) => organizationId !== organization.id);

      let result: string;

      if (otherOrganizationId) {
        const { token: newToken } = await api.switchOrganization({
          path: { id: otherOrganizationId },
          header: {},
        });

        result = newToken!.id!;
      } else {
        const { token: newToken } = await api.newSession({});

        result = newToken!.id!;
      }

      await api.deleteOrganization({
        path: { id: organization.id },
      });

      return result;
    },
    onSuccess(token) {
      setToken(token);
      navigate({ to: '/' });
      notify.info(t('successNotification', { organizationName: organization.name }));
    },
  });

  const isDeactivated = organization.status === 'DEACTIVATED';
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
