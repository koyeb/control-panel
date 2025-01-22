import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useDomainsQuery } from 'src/api/hooks/domain';
import { useOrganizationQuotas } from 'src/api/hooks/session';
import { Dialog } from 'src/components/dialog';
import { DocumentTitle } from 'src/components/document-title';
import { Title } from 'src/components/title';
import { useMount } from 'src/hooks/lifecycle';
import { useHistoryState } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { CreateDomainDialog } from './components/create-domain-dialog';
import { DomainsList } from './components/domains-list';
import { DomainsLocked } from './components/domains-locked';

const T = createTranslate('pages.domains');

export function DomainsPage() {
  const t = T.useTranslate();

  const historyState = useHistoryState<{ create: boolean }>();
  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  useMount(() => {
    if (historyState.create) {
      openDialog('CreateDomain');
    }
  });

  const [expanded, setExpanded] = useState<string>();
  const quotas = useOrganizationQuotas();
  const { data: domains } = useDomainsQuery('custom');
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
          <Button className={clsx(!hasDomains && 'hidden')} onClick={() => openDialog('CreateDomain')}>
            <T id="createDomain" />
          </Button>
        }
      />

      <DomainsList
        expanded={expanded}
        toggleExpanded={(domain) => setExpanded(domain.id === expanded ? undefined : domain.id)}
        onCreate={() => openDialog('CreateDomain')}
      />

      <CreateDomainDialog
        onCreated={(domainId) => {
          setExpanded(domainId);
          closeDialog();
        }}
      />
    </div>
  );
}
