import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useDomainsQuery } from 'src/api/hooks/domain';
import { useOrganization } from 'src/api/hooks/session';
import { DocumentTitle } from 'src/components/document-title';
import { Title } from 'src/components/title';
import { Translate } from 'src/intl/translate';

import { CreateDomainDialog } from './components/create-domain-dialog';
import { DomainsList } from './components/domains-list';
import { DomainsLocked } from './components/domains-locked';

const T = Translate.prefix('pages.domains');

export function DomainsPage() {
  const t = T.useTranslate();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<string>();
  const organization = useOrganization();
  const { data: domains } = useDomainsQuery('custom');

  if (organization.plan == 'hobby') {
    return <DomainsLocked />;
  }

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <Title
        title={<T id="title" />}
        end={
          <Button
            className={clsx(domains && domains.length === 0 && 'hidden')}
            onClick={() => setCreateDialogOpen(true)}
          >
            <T id="createDomain" />
          </Button>
        }
      />

      <DomainsList
        expanded={expanded}
        toggleExpanded={(domain) => setExpanded(domain.id === expanded ? undefined : domain.id)}
        onCreate={() => setCreateDialogOpen(true)}
      />

      <CreateDomainDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={(domainId) => {
          setExpanded(domainId);
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
