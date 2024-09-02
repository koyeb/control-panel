import clsx from 'clsx';
import { SVGProps, useState } from 'react';

import { Alert, ButtonMenuItem, Spinner, Table, useBreakpoint } from '@koyeb/design-system';
import { useDomainsQuery } from 'src/api/hooks/domain';
import { useApps } from 'src/api/hooks/service';
import { Domain, type DomainStatus } from 'src/api/model';
import { stopPropagation } from 'src/application/dom-events';
import { ActionsMenu } from 'src/components/actions-menu';
import { IconCircleCheck, IconCircleAlert, IconChevronDown } from 'src/components/icons';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { ChangeAppForm } from './change-app-form';
import { DeleteDomainDialog } from './delete-domain-dialog';
import { DnsConfiguration } from './dns-configuration';
import { NoDomains } from './no-domains';

const T = Translate.prefix('pages.domains.domainsList');

type DomainsListProps = {
  expanded: string | undefined;
  toggleExpanded: (domain: Domain) => void;
  onCreate: () => void;
};

export function DomainsList({ expanded, toggleExpanded, onCreate }: DomainsListProps) {
  const isMobile = !useBreakpoint('sm');
  const { data: domains, isPending, isError, error } = useDomainsQuery('custom');

  if (isPending) {
    return <Loading />;
  }

  if (isError) {
    return <QueryError error={error} />;
  }

  if (domains.length === 0) {
    return <NoDomains onCreate={onCreate} />;
  }

  return (
    <Table
      items={domains}
      columns={{
        expand: {
          className: clsx('lg:w-12'),
          render: (domain) => (
            <IconChevronDown className={clsx('text-icon size-4', expanded === domain.id && 'rotate-180')} />
          ),
        },
        name: {
          header: <T id="name" />,
          render: (domain) => domain.name,
        },
        status: {
          header: <T id="status" />,
          render: (domain) => <DomainStatus status={domain.status} />,
        },
        assignedTo: {
          header: <T id="assignedTo" />,
          render: (domain) => <AppName appId={domain.appId} />,
        },
        updated: {
          hidden: isMobile,
          className: clsx('lg:w-48'),
          header: <T id="updated" />,
          render: (domain) => <FormattedDistanceToNow value={domain.updatedAt} />,
        },
        actions: {
          className: clsx('w-12'),
          render: (domain) => <DomainActions domain={domain} />,
        },
      }}
      onRowClick={toggleExpanded}
      isExpanded={(domain) => expanded === domain.id}
      renderExpanded={(domain) => (
        <div className="col gap-6 px-3 pb-4 pt-2">
          <DomainError domain={domain} />
          <DnsConfiguration domain={domain} />
          <ChangeAppForm domain={domain} />
        </div>
      )}
      classes={{
        tr: (domain) => clsx(expanded === domain?.id && 'bg-gradient-to-b from-inverted/5 to-inverted/0'),
      }}
    />
  );
}

function DomainStatus({ status }: { status: DomainStatus }) {
  const { Icon, className } = domainStatusIconMap[status];

  return (
    <div className="row items-center gap-2">
      <span>
        <Icon className={clsx('size-4', className)} />
      </span>
      <span className="capitalize">{status}</span>
    </div>
  );
}

const domainStatusIconMap: Record<
  DomainStatus,
  { Icon: React.ComponentType<SVGProps<SVGSVGElement>>; className?: string }
> = {
  pending: { Icon: Spinner },
  active: { Icon: IconCircleCheck, className: 'text-green' },
  error: { Icon: IconCircleAlert, className: 'text-red' },
  deleting: { Icon: Spinner },
  deleted: { Icon: IconCircleCheck },
};

function AppName({ appId }: { appId: string | null }) {
  const app = useApps()?.find(hasProperty('id', appId));

  if (app) {
    return app.name;
  }

  return <Translate id="common.noValue" />;
}

function DomainActions({ domain }: { domain: Domain }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div onClick={stopPropagation}>
      <ActionsMenu>
        {(withClose) => (
          <ButtonMenuItem
            disabled={domain.status === 'deleting'}
            onClick={withClose(() => setDeleteDialogOpen(true))}
          >
            <T id="actions.delete" />
          </ButtonMenuItem>
        )}
      </ActionsMenu>

      <DeleteDomainDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        domain={domain}
      />
    </div>
  );
}

function DomainError({ domain }: { domain: Domain }) {
  if (domain.status !== 'error') {
    return null;
  }

  return <Alert variant="error" title={<T id="error" />} description={domain.messages.join('\n')} />;
}
