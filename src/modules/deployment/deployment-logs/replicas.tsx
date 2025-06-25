import { HelpTooltip, TabButton, TabButtons, Tooltip } from '@koyeb/design-system';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { FormattedDate } from 'react-intl';

import type { Api } from 'src/api/api-types';
import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { useDeploymentScalingQuery } from 'src/api/hooks/service';
import type { CatalogRegion, ComputeDeployment, Instance, InstanceStatus, Replica } from 'src/api/model';
import { parseBytes } from 'src/application/memory';
import { ControlledSelect } from 'src/components/controlled';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { Dialog } from 'src/components/dialog';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { QueryGuard } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { createTranslate, TranslateStatus } from 'src/intl/translate';
import { CpuGraph } from 'src/modules/metrics/graphs/cpu-graph';
import { MemoryGraph } from 'src/modules/metrics/graphs/memory-graph';
import { useMetricsQueries } from 'src/modules/metrics/use-metrics';
import { identity } from 'src/utils/generic';
import { getId } from 'src/utils/object';

import { ReplicaHistoryDialog } from './replica-history-dialog';

const T = createTranslate('modules.deployment.deploymentLogs.replicas');

type Filters = {
  region: string | null;
  status: InstanceStatus | null;
};

export function Replicas({ deployment }: { deployment: ComputeDeployment }) {
  const regions = useRegions(deployment.definition.regions);

  const filters = useForm<Filters>({
    defaultValues: {
      region: null,
      status: null,
    },
  });

  const query = useDeploymentScalingQuery(deployment.id, {
    region: filters.watch('region') ?? undefined,
  });

  return (
    <div className="m-4 mt-0 rounded-md border">
      <div className="col gap-4 px-3 py-4 md:row md:items-center">
        <div className="me-auto row items-center gap-2 font-medium">
          <T id="title" />
          <HelpTooltip>
            <T id="helpTooltip" />
          </HelpTooltip>
        </div>

        <StatusFilter filters={filters} />
        <RegionFilter filters={filters} regions={regions} />
      </div>

      <QueryGuard query={query}>
        {(replicas) => <ReplicaList deployment={deployment} filters={filters} replicas={replicas} />}
      </QueryGuard>
    </div>
  );
}

type StatusFilterProps = {
  filters: UseFormReturn<Filters>;
};

function StatusFilter({ filters }: StatusFilterProps) {
  const t = T.useTranslate();

  const statuses: InstanceStatus[] = [
    'ALLOCATING',
    'STARTING',
    'HEALTHY',
    'UNHEALTHY',
    'STOPPING',
    'STOPPED',
    'ERROR',
    'SLEEPING',
  ];

  return (
    <ControlledSelect
      control={filters.control}
      name="status"
      items={statuses}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      placeholder={t('filters.allStatuses')}
      renderItem={(status) => <TranslateStatus status={status} />}
      onItemClick={(status) => status === filters.watch('status') && filters.setValue('status', null)}
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
      items={regions}
      getKey={getId}
      itemToString={(region) => region.name}
      itemToValue={getId}
      placeholder={t('filters.allRegions')}
      renderItem={(item) => {
        return (
          <div className="row items-center gap-2">
            <RegionFlag regionId={item.id} className="size-4" />
            <RegionName regionId={item.id} />
          </div>
        );
      }}
      onItemClick={(region) => region.id === filters.watch('region') && filters.setValue('region', null)}
      className="min-w-52"
    />
  );
}

type ReplicaListProps = {
  deployment: ComputeDeployment;
  filters: UseFormReturn<Filters>;
  replicas: Replica[];
};

function ReplicaList({ deployment, filters, replicas }: ReplicaListProps) {
  const filteredReplicas = replicas.filter(
    (replica) => filters.watch('status') === null || replica.status === filters.watch('status'),
  );

  if (replicas.length === 0) {
    return <Loading className="bg-muted/50" />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 bg-muted/50 p-4 sm:grid-cols-2 md:grid-cols-3">
      {filteredReplicas.map((replica) => (
        <Replica key={`${replica.region}-${replica.index}`} deployment={deployment} replica={replica} />
      ))}

      {filteredReplicas.length === 0 && <T id="noInstances" />}
    </div>
  );
}

function Replica({ deployment, replica }: { deployment: ComputeDeployment; replica: Replica }) {
  const t = T.useTranslate();
  const openDialog = Dialog.useOpen();

  const message = useMemo(() => {
    if (replica.messages) {
      return replica.messages.join(' ');
    }

    return t('noInstances');
  }, [replica, t]);

  return (
    <>
      <ReplicaHistoryDialog deployment={deployment} region={replica.region} replicaIndex={replica.index} />

      <div className="col min-w-0 gap-3 rounded-md border bg-neutral p-3">
        <div className="row items-center gap-2">
          <div className="font-medium">
            <T id="replicaIndex" values={{ index: replica.index }} />
          </div>

          <RegionFlag regionId={replica.region} className="size-4" />

          {replica.status && <InstanceStatusBadge status={replica.status} className="ms-auto" />}
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

          <button
            type="button"
            onClick={() =>
              openDialog('ReplicaHistory', {
                deploymentId: deployment.id,
                regionId: replica.region,
                replicaIndex: replica.index,
              })
            }
            className="ms-auto text-link text-xs"
          >
            <T id="viewDetails" />
          </button>
        </div>
      </div>
    </>
  );
}

const red = clsx('bg-red');
const green = clsx('bg-green');
const blue = clsx('bg-blue');
const neutral = clsx('bg-gray/50');

const instanceStatusClasses: Record<InstanceStatus, string> = {
  ALLOCATING: blue,
  STARTING: blue,
  HEALTHY: green,
  UNHEALTHY: red,
  STOPPING: neutral,
  STOPPED: neutral,
  ERROR: red,
  SLEEPING: neutral,
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

        <CopyIconButton text={instance.id} className="size-em text-icon" />

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
          max={instanceType ? parseBytes(instanceType.memory) : null}
        />
      )}
    </div>
  );
}
