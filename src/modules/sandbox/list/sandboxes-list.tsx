import { InputStart, ProgressBar } from '@koyeb/design-system';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { Controller, UseFormReturn } from 'react-hook-form';
import { FormattedNumber } from 'react-intl';

import { useComputeDeployment } from 'src/api';
import { ControlledInput } from 'src/components/forms';
import { Pagination } from 'src/components/pagination';
import { ServiceStatusesSelector } from 'src/components/selectors/service-status-selector';
import { DeploymentStatusBadge } from 'src/components/status-badges';
import { IconDocker, IconSearch } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { ComputeDeployment, Service, ServiceStatus } from 'src/model';
import { useDeploymentMetric } from 'src/modules/deployment/deployment-metrics/deployment-metrics';
import { InstanceMetadataValue, RegionsMetadataValue } from 'src/modules/deployment/metadata';

import { NoSandboxes } from './no-sandboxes';

const T = createTranslate('pages.sandbox.list');

export type SandboxesFiltersForm = {
  search: string;
  statuses: ServiceStatus[];
};

type SandboxesListProps = {
  hasSandboxes: boolean;
  services: Service[];
  pagination: Pagination;
  filtersForm: UseFormReturn<SandboxesFiltersForm>;
};

export function SandboxesList({ hasSandboxes, services, pagination, filtersForm }: SandboxesListProps) {
  const noResults = services.length === 0 || filtersForm.watch('statuses').length === 0;

  return (
    <div className="col gap-8">
      <div className="row items-center gap-4">
        <h1 className="typo-heading">
          <T id="title" />
        </h1>

        {services.length > 0 && <div className="text-dim">{services.length}</div>}
      </div>

      {hasSandboxes && <Filters form={filtersForm} />}

      {noResults && <EmptyState hasSandboxes={hasSandboxes} filtersForm={filtersForm} />}

      {!noResults && (
        <div className="col gap-3">
          {services.map((service) => (
            <SandboxItem key={service.id} service={service} />
          ))}
        </div>
      )}

      {pagination.hasPages && <Pagination pagination={pagination} />}
    </div>
  );
}

type EmptyStateProps = {
  hasSandboxes: boolean;
  filtersForm: UseFormReturn<SandboxesFiltersForm>;
};

function EmptyState({ hasSandboxes, filtersForm }: EmptyStateProps) {
  if (hasSandboxes) {
    return <NoResults resetFilters={() => filtersForm.reset()} />;
  }

  return <NoSandboxes />;
}

function NoResults({ resetFilters }: { resetFilters: () => void }) {
  return (
    <div className="col min-h-64 items-center justify-center gap-4 rounded border p-3">
      <div className="col gap-2 text-center">
        <div className="text-base font-medium">
          <T id="noResults.title" />
        </div>
        <div className="text-dim">
          <T id="noResults.description" />
        </div>
      </div>

      <button type="button" className="font-medium text-green" onClick={resetFilters}>
        <T id="noResults.removeFilters" />
      </button>
    </div>
  );
}

function Filters({ form }: { form: UseFormReturn<SandboxesFiltersForm> }) {
  const t = T.useTranslate();

  return (
    <form className="col items-start gap-3 sm:row sm:items-center sm:gap-2">
      <ControlledInput
        control={form.control}
        type="search"
        name="search"
        placeholder={t('search')}
        start={
          <InputStart background={false}>
            <IconSearch className="size-4 text-dim" />
          </InputStart>
        }
      />

      <Controller
        control={form.control}
        name="statuses"
        render={({ field }) => <ServiceStatusesSelector label={<T id="status" />} {...field} />}
      />
    </form>
  );
}

function SandboxItem({ service }: { service: Service }) {
  const deployment = useComputeDeployment(service.latestDeploymentId);

  if (!deployment) {
    return null;
  }

  const { source, instanceType, regions } = deployment.definition;

  return (
    <div
      className={clsx(
        'grid items-center gap-6 rounded-md border p-3',
        'grid-cols-1',
        'lg:grid-cols-[14rem_6rem_4rem_5rem_7rem_7rem_auto]',
        '2xl:grid-cols-[16rem_9rem_9rem_9rem_6rem_6rem_auto]',
      )}
    >
      <div className="row items-center justify-between gap-2 truncate">
        <Link to="/sandboxes/$serviceId" params={{ serviceId: service.id }} className="truncate font-medium">
          {service.name}
        </Link>

        <DeploymentStatusBadge status={deployment.status} />
      </div>

      <div className="truncate text-xs">
        <InstanceMetadataValue instance={instanceType} />
      </div>

      <div className="row items-center gap-2 text-xs">
        <div className="text-dim max-lg:w-14">
          <T id="cpu" />
        </div>

        <MetricValue deployment={deployment} metric="cpu" />
      </div>

      <div className="row items-center gap-2 text-xs">
        <div className="text-dim max-lg:w-14">
          <T id="memory" />
        </div>

        <MetricValue deployment={deployment} metric="memory" />
      </div>

      <div>
        <RegionsMetadataValue regions={regions} />
      </div>

      <div className="row items-center gap-1 text-xs">
        {source.type === 'docker' && (
          <>
            <div>
              <IconDocker className="size-3" />
            </div>
            <div className="truncate">{source.image}</div>
          </>
        )}
      </div>

      <div className="truncate text-xs text-dim lg:text-right">
        <FormattedDistanceToNow value={deployment.date} />
      </div>
    </div>
  );
}

function MetricValue({ deployment, metric }: { deployment: ComputeDeployment; metric: 'cpu' | 'memory' }) {
  const value = useDeploymentMetric(deployment, metric);

  if (value === undefined) {
    return <Translate id="common.noValue" />;
  }

  return (
    <>
      <ProgressBar progress={value} className="max-w-32 flex-1 lg:max-2xl:hidden" />
      <FormattedNumber value={value} style="percent" />
    </>
  );
}
