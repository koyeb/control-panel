import { Alert, Spinner, Table, TableColumnSelection, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';

import { useApps } from 'src/api';
import { SvgComponent } from 'src/application/types';
import { IconChevronDown, IconCircleAlert, IconCircleCheck } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, TranslateStatus, createTranslate } from 'src/intl/translate';
import { Domain, type DomainStatus } from 'src/model';
import { hasProperty } from 'src/utils/object';

import { ChangeAppForm } from './change-app-form';
import { DnsConfiguration } from './dns-configuration';
import { DomainActions } from './domains-actions';
import { NoDomains } from './no-domains';

const T = createTranslate('pages.domains.list');

type DomainsListProps = {
  domains: Domain[];
  expanded: string | undefined;
  toggleExpanded: (domain: Domain) => void;
  onCreate: () => void;
  selection: TableColumnSelection<Domain>;
};

export function DomainsList({ domains, expanded, toggleExpanded, onCreate, selection }: DomainsListProps) {
  const isMobile = !useBreakpoint('sm');

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
            <IconChevronDown className={clsx('size-4 text-icon', expanded === domain.id && 'rotate-180')} />
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
        <div className="col gap-6 px-3 pt-2 pb-4">
          <DomainError domain={domain} />
          <DnsConfiguration domain={domain} />
          <ChangeAppForm domain={domain} />
        </div>
      )}
      selection={selection}
      classes={{
        tr: (domain) => clsx(expanded === domain?.id && 'bg-linear-to-b from-inverted/5 to-inverted/0'),
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
      <TranslateStatus status={status} />
    </div>
  );
}

const domainStatusIconMap: Record<DomainStatus, { Icon: SvgComponent; className?: string }> = {
  PENDING: { Icon: Spinner },
  ACTIVE: { Icon: IconCircleCheck, className: 'text-green' },
  ERROR: { Icon: IconCircleAlert, className: 'text-red' },
  DELETING: { Icon: Spinner },
  DELETED: { Icon: IconCircleCheck },
};

function AppName({ appId }: { appId: string | null }) {
  const app = useApps()?.find(hasProperty('id', appId));

  if (app) {
    return app.name;
  }

  return <Translate id="common.noValue" />;
}

function DomainError({ domain }: { domain: Domain }) {
  if (domain.status !== 'ERROR') {
    return null;
  }

  return <Alert variant="error" title={<T id="error" />} description={domain.messages.join('\n')} />;
}
