import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { useApi, useDomainsQuery, useInvalidateApiQuery, useOrganizationQuotas } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { DocumentTitle } from 'src/components/document-title';
import { QueryGuard } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { useSet } from 'src/hooks/collection';
import { useOnRouteStateCreate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { Domain } from 'src/model';

import { CreateDomainDialog } from './components/create-domain-dialog';
import { DomainsList } from './components/domains-list';
import { DomainsLocked } from './components/domains-locked';

const T = createTranslate('pages.domains');

export function DomainsPage() {
  const t = T.useTranslate();

  useOnRouteStateCreate(() => {
    openDialog('CreateDomain');
  });

  const [selected, { toggle, set, clear }] = useSet<Domain>();
  const [expanded, setExpanded] = useState<string>();

  const quotas = useOrganizationQuotas();

  const query = useDomainsQuery('custom');
  const domains = query.data;
  const hasDomains = domains !== undefined && domains.length > 0;

  const bulkDeleteMutation = useBulkDeleteMutation(() => clear());

  const onBulkDelete = () => {
    openDialog('Confirmation', {
      title: t('bulkDelete.title'),
      description: t('bulkDelete.description', { count: selected.size }),
      confirmationText: t('bulkDelete.confirmationText'),
      submitText: t('bulkDelete.confirm'),
      onConfirm: () => bulkDeleteMutation.mutateAsync(Array.from(selected.values())),
    });
  };

  if (quotas.maxDomains === 0 && !hasDomains) {
    return <DomainsLocked />;
  }

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <Title
        title={<T id="title" />}
        end={
          <div className="row gap-4">
            <Button
              variant="outline"
              onClick={onBulkDelete}
              className={clsx(selected.size === 0 && 'hidden!')}
            >
              <T id="deleteDomains" values={{ count: selected.size }} />
            </Button>

            <Button className={clsx(!hasDomains && 'hidden!')} onClick={() => openDialog('CreateDomain')}>
              <T id="createDomain" />
            </Button>
          </div>
        }
      />

      <QueryGuard query={query}>
        {(domains) => (
          <DomainsList
            domains={domains}
            expanded={expanded}
            toggleExpanded={(domain) => setExpanded(domain.id === expanded ? undefined : domain.id)}
            onCreate={() => openDialog('CreateDomain')}
            selection={{ selected, selectAll: () => set(domains), clear, toggle }}
          />
        )}
      </QueryGuard>

      <CreateDomainDialog
        onCreated={(domainId) => {
          setExpanded(domainId);
          closeDialog();
        }}
      />
    </div>
  );
}

function useBulkDeleteMutation(onDeleted: () => void) {
  const t = T.useTranslate();

  const api = useApi();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    async mutationFn(domains: Domain[]) {
      return Promise.allSettled(
        domains.map((domain) => api('delete /v1/domains/{id}', { path: { id: domain.id } })),
      );
    },
    async onSuccess(result) {
      await invalidate('get /v1/domains');

      const fulfilled = result.filter((result) => result.status === 'fulfilled');
      notify.success(t('bulkDelete.successNotification', { count: fulfilled.length }));

      closeDialog();
      onDeleted();
    },
  });
}
