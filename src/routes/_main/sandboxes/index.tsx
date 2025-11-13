import { InputStart, ProgressBar } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import clsx from 'clsx';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';
import { FormattedNumber } from 'react-intl';

import { apiQuery, mapService, useComputeDeployment } from 'src/api';
import { ControlledInput } from 'src/components/forms';
import { QueryGuard } from 'src/components/query-error';
import { ServiceStatusesSelector } from 'src/components/selectors/service-status-selector';
import { DeploymentStatusBadge } from 'src/components/status-badges';
import { useDebouncedValue } from 'src/hooks/timers';
import { IconDocker, IconSearch } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { ComputeDeployment, Service, ServiceStatus } from 'src/model';
import { useDeploymentMetric } from 'src/modules/deployment/deployment-metrics/deployment-metrics';
import { InstanceMetadataValue, RegionsMetadataValue } from 'src/modules/deployment/metadata';

const T = createTranslate('pages.sandbox.list');

export const Route = createFileRoute('/_main/sandboxes/')({
  component: SandboxesListPage,
});

type FiltersForm = {
  search: string;
  statuses: ServiceStatus[];
};

function SandboxesListPage() {
  const filtersForm = useForm<FiltersForm>({
    defaultValues: {
      search: '',
      statuses: ['STARTING', 'RESUMING', 'HEALTHY', 'DEGRADED', 'UNHEALTHY', 'PAUSED', 'DELETED'],
    },
  });

  const searchDebounced = useDebouncedValue(filtersForm.watch('search'), 200);
  const statuses = filtersForm.watch('statuses').slice();

  if (statuses.includes('PAUSED')) {
    statuses.push('PAUSING');
  }

  if (statuses.includes('DELETED')) {
    statuses.push('DELETING');
  }

  const query = useQuery({
    ...apiQuery('get /v1/services', {
      query: {
        types: ['SANDBOX'],
        limit: '100',
        name: searchDebounced || undefined,
        statuses,
      },
    }),
    placeholderData: keepPreviousData,
    select: ({ services }) => services!.map(mapService),
  });

  return (
    <QueryGuard query={query}>
      {(services) => (
        <div className="col gap-8">
          <div className="row items-center gap-4">
            <h1 className="typo-heading">
              <T id="title" />
            </h1>

            <div className="text-dim">{services.length}</div>
          </div>

          <Filters form={filtersForm} />

          <div className="col gap-3">
            {services.map((service) => (
              <SandboxItem key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}
    </QueryGuard>
  );
}

function Filters({ form }: { form: UseFormReturn<FiltersForm> }) {
  const t = T.useTranslate();

  return (
    <form className="row items-center gap-2">
      <ControlledInput
        control={form.control}
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
        'grid-cols-[7rem_6rem_7rem_4rem_5rem_7rem_7rem_auto]',
        '2xl:grid-cols-[8rem_6rem_9rem_9rem_9rem_6rem_6rem_auto]',
      )}
    >
      <Link to="/sandboxes/$serviceId" params={{ serviceId: service.id }} className="truncate font-medium">
        {service.name}
      </Link>

      <div className="row items-center gap-2 truncate">
        <DeploymentStatusBadge status={deployment.status} />
      </div>

      <div className="truncate text-xs">
        <InstanceMetadataValue instance={instanceType} />
      </div>

      <div className="row items-center gap-2 text-xs">
        <div className="text-dim">
          <T id="cpu" />
        </div>

        <MetricValue deployment={deployment} metric="cpu" />
      </div>

      <div className="row items-center gap-2 text-xs">
        <div className="text-dim">
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

      <div className="truncate text-right text-xs text-dim">
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
      <ProgressBar progress={value} className="flex-1 max-2xl:hidden" />
      <FormattedNumber value={value} style="percent" />
    </>
  );
}
