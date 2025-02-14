import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useDomainsQuery } from 'src/api/hooks/domain';
import { useOrganizationQuotas } from 'src/api/hooks/session';
import { Domain } from 'src/api/model';
import { Dialog } from 'src/components/dialog';
import { DocumentTitle } from 'src/components/document-title';
import { QueryGuard } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { useSet } from 'src/hooks/collection';
import { useOnRouteStateCreate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { BulkDeleteDomainsDialog } from './components/bulk-delete-domains-dialog';
import { CreateDomainDialog } from './components/create-domain-dialog';
import { DomainsList } from './components/domains-list';
import { DomainsLocked } from './components/domains-locked';

const T = createTranslate('pages.domains');

export function DomainsPage() {
  const t = T.useTranslate();

  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  useOnRouteStateCreate(() => {
    openDialog('CreateDomain');
  });

  const [selected, { toggle, set, clear }] = useSet<Domain>();
  const [expanded, setExpanded] = useState<string>();

  const quotas = useOrganizationQuotas();

  const query = useDomainsQuery('custom');
  const domains = query.data;
  const hasDomains = domains !== undefined && domains.length > 0;

  if (quotas?.maxDomains === 0 && !hasDomains) {
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
              onClick={() => openDialog('ConfirmBulkDeleteDomains')}
              className={clsx(selected.size === 0 && 'hidden')}
            >
              <T id="deleteDomains" values={{ count: selected.size }} />
            </Button>

            <Button className={clsx(!hasDomains && 'hidden')} onClick={() => openDialog('CreateDomain')}>
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

      <BulkDeleteDomainsDialog domains={domains ?? []} onDeleted={clear} />

      <CreateDomainDialog
        onCreated={(domainId) => {
          setExpanded(domainId);
          closeDialog();
        }}
      />
    </div>
  );
}
