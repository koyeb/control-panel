import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { FormattedDate } from 'react-intl';

import { HelpTooltip, TabButton, TabButtons, Tooltip } from '@koyeb/design-system';
import { ApiEndpointParams } from 'src/api/api';
import type { Api } from 'src/api/api-types';
import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { mapInstance } from 'src/api/mappers/deployment';
import type { CatalogRegion, ComputeDeployment, Instance, InstanceStatus, Replica } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { parseBytes } from 'src/application/memory';
import { ControlledSelect } from 'src/components/controlled';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { Metadata } from 'src/components/metadata';
import { QueryGuard } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { createTranslate } from 'src/intl/translate';
import { CpuGraph } from 'src/modules/metrics/graphs/cpu-graph';
import { MemoryGraph } from 'src/modules/metrics/graphs/memory-graph';
import { useMetricsQueries } from 'src/modules/metrics/use-metrics';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('modules.deployment.deploymentLogs.replicas');

type Filters = {
  region: string | null;
  status: InstanceStatus | null;
};

function getApiFilters(filters: Filters): ApiEndpointParams<'getDeploymentScaling'>['query'] {
  return {
    region: filters.region === null ? undefined : filters.region,
  };
}

export function Replicas({ deployment }: { deployment: ComputeDeployment }) {
  const regions = useRegions(deployment.definition.regions);

  const filters = useForm<Filters>({
    defaultValues: {
      region: null,
      status: null,
    },
  });

  const query = useQuery({
    ...useApiQueryFn('getDeploymentScaling', {
      path: { id: deployment.id },
      query: getApiFilters(filters.watch()),
    }),
    select: ({ replicas }) =>
      replicas!.map(
        (replica): Replica => ({
          index: replica.replica_index!,
          region: replica.region!,
          instances: replica.instances!.map(mapInstance),
        }),
      ),
  });

  return (
    <QueryGuard query={query}>
      {(replicas) => (
        <div className="rounded-md border">
          <div className="col md:row gap-4 px-3 py-4 md:items-center">
            <div className="row me-auto items-center gap-2 font-medium">
              <T id="title" />
              <HelpTooltip>
                <T id="helpTooltip" />
              </HelpTooltip>
            </div>

            <StatusFilter filters={filters} />
            <RegionFilter filters={filters} regions={regions} />
          </div>

          <div className="grid grid-cols-1 gap-3 bg-muted/50 p-4 sm:grid-cols-2 md:grid-cols-3">
            {replicas.map((replica) => (
              <Replica key={`${replica.region}-${replica.index}`} replica={replica} />
            ))}
          </div>
        </div>
      )}
    </QueryGuard>
  );
}

type StatusFilterProps = {
  filters: UseFormReturn<Filters>;
};

function StatusFilter({ filters }: StatusFilterProps) {
  const t = T.useTranslate();

  const statuses: InstanceStatus[] = [
    'allocating',
    'starting',
    'healthy',
    'unhealthy',
    'stopping',
    'stopped',
    'error',
    'sleeping',
  ];

  return (
    <ControlledSelect
      control={filters.control}
      name="status"
      items={[null, ...statuses]}
      getKey={(item) => (item === null ? 'all' : item)}
      itemToString={(item) => (item === null ? 'all' : item)}
      itemToValue={(item) => (item === null ? null : item)}
      placeholder={t('filters.allStatuses')}
      renderItem={(status) => {
        if (status === null) {
          return <T id="filters.allStatuses" />;
        }

        return <div className="capitalize">{status}</div>;
      }}
      className="min-w-52"
    />
  );
}

type RegionFilterProps = {
  filters: UseFormReturn<Filters>;
  regions: CatalogRegion[];
};

function RegionFilter({ filters, regions }: RegionFilterProps) {
  const t = T.useTranslate();

  return (
    <ControlledSelect
      control={filters.control}
      name="region"
      items={[null, ...regions]}
      getKey={(item) => (item === null ? 'all' : item.id)}
      itemToString={(item) => (item === null ? 'all' : item.displayName)}
      itemToValue={(item) => (item === null ? null : item.id)}
      placeholder={t('filters.allRegions')}
      renderItem={(item) => {
        if (item === null) {
          return <T id="filters.allRegions" />;
        }

        return (
          <div className="row items-center gap-2">
            <RegionFlag regionId={item.id} className="size-4" />
            <RegionName regionId={item.id} />
          </div>
        );
      }}
      className="min-w-52"
    />
  );
}

function Replica({ replica }: { replica: Replica }) {
  const t = T.useTranslate();
  const instance = replica.instances.find(hasProperty('status', 'healthy')) ?? replica.instances[0];

  const message = useMemo(() => {
    if (instance) {
      return instance.messages.join(' ');
    }

    return t('noInstances');
  }, [instance, t]);

  return (
    <div className="col min-w-0 gap-3 rounded-md border bg-neutral p-3">
      <div className="row items-center gap-2">
        <div className="font-medium">
          <T id="replicaIndex" values={{ index: replica.index }} />
        </div>

        <RegionFlag regionId={replica.region} className="size-4" />

        {instance && <InstanceStatusBadge status={instance.status} className="ms-auto" />}
      </div>

      <Tooltip allowHover content={message}>
        {(props) => (
          <div {...props} className="max-w-full self-start truncate text-dim">
            {message}
          </div>
        )}
      </Tooltip>

      <div className="border-t" />

      <div className="row flex-wrap gap-2">
        {replica.instances.map((instance) => (
          <Tooltip
            key={instance.id}
            allowHover
            color="neutral"
            placement="top"
            arrow={false}
            content={<InstanceDetails instance={instance} />}
            className="max-w-none dark:border"
          >
            {(props) => (
              <div {...props} className={clsx('size-5 rounded', instanceStatusClasses[instance.status])} />
            )}
          </Tooltip>
        ))}

        {replica.instances.length === 0 && <div className="size-5" />}
      </div>
    </div>
  );
}

const red = clsx('bg-red');
const green = clsx('bg-green');
const blue = clsx('bg-blue');
const neutral = clsx('bg-gray/50');

const instanceStatusClasses: Record<InstanceStatus, string> = {
  allocating: blue,
  starting: blue,
  healthy: green,
  unhealthy: red,
  stopping: neutral,
  stopped: neutral,
  error: red,
  sleeping: neutral,
};

const metrics: Api.MetricName[] = ['CPU_TOTAL_PERCENT', 'MEM_RSS'] as const;

function InstanceDetails({ instance }: { instance: Instance }) {
  const [graph, setGraph] = useState<'cpu' | 'memory'>('cpu');
  const instanceType = useInstance(instance.type);

  const metricsQuery = useMetricsQueries({
    instanceId: instance.id,
    metrics,
    timeFrame: '6h',
  });

  return (
    <div className="col w-80 gap-2 p-2 font-normal">
      <div className="row items-center gap-2">
        <div className="text-sm font-medium">{instance.name}</div>

        <CopyIconButton text={instance.id} className="text-icon size-em" />

        <InstanceStatusBadge status={instance.status} className="ms-auto" />
      </div>

      <div className="text-dim">{instance.messages.join(' ')}</div>

      <div className="border-t" />

      <div className="row gap-8">
        <Metadata
          label={<T id="regionLabel" />}
          value={
            <div className="row gap-2">
              <RegionFlag regionId={instance.region} className="size-4" />
              <RegionName regionId={instance.region} />
            </div>
          }
        />

        <Metadata label={<T id="instanceTypeLabel" />} value={instanceType?.displayName} />

        <Metadata
          label={<T id="creationDateLabel" />}
          value={<FormattedDate value={instance.createdAt} dateStyle="short" timeStyle="short" />}
        />
      </div>

      <TabButtons className="my-2 self-start">
        <TabButton selected={graph === 'cpu'} onClick={() => setGraph('cpu')}>
          <T id="cpu" />
        </TabButton>
        <TabButton selected={graph === 'memory'} onClick={() => setGraph('memory')}>
          <T id="memory" />
        </TabButton>
      </TabButtons>

      {graph === 'cpu' && (
        <CpuGraph
          loading={metricsQuery.isPending}
          error={metricsQuery.error.CPU_TOTAL_PERCENT}
          data={metricsQuery.data.CPU_TOTAL_PERCENT}
        />
      )}

      {graph === 'memory' && (
        <MemoryGraph
          loading={metricsQuery.isPending}
          error={metricsQuery.error.MEM_RSS}
          data={metricsQuery.data.MEM_RSS}
          max={instanceType ? parseBytes(instanceType.ram) : null}
        />
      )}
    </div>
  );
}
