import clsx from 'clsx';
import uniq from 'lodash-es/uniq';
import { useMemo, useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { FormattedDate } from 'react-intl';

import { HelpTooltip, TabButton, TabButtons, Tooltip } from '@koyeb/design-system';
import type { Api } from 'src/api/api-types';
import { useInstance } from 'src/api/hooks/catalog';
import { Instance, InstanceStatus } from 'src/api/model';
import { parseBytes } from 'src/application/memory';
import { ControlledSelect } from 'src/components/controlled';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { createTranslate } from 'src/intl/translate';
import { CpuGraph } from 'src/modules/metrics/graphs/cpu-graph';
import { MemoryGraph } from 'src/modules/metrics/graphs/memory-graph';
import { useMetricsQueries } from 'src/modules/metrics/use-metrics';
import { inArray } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('modules.deployment.deploymentLogs.replicas');

type Filters = {
  region: string;
  status: InstanceStatus | 'all';
};

export function Replicas({ instances }: { instances: Instance[] }) {
  const replicas = useReplicas(instances);

  const regions = uniq(instances.map((instance) => instance.region));
  const statuses = uniq(instances.map((instance) => instance.status));

  const filters = useForm<Filters>({
    defaultValues: {
      region: 'all',
      status: 'all',
    },
  });

  const regionFilter = filters.watch('region');
  const filteredRegions = regionFilter === 'all' ? regions : [regionFilter];

  const statusFilter = filters.watch('status');
  const filteredStatuses = statusFilter === 'all' ? statuses : [statusFilter];

  const filteredReplicas = replicas.filter(
    ([instance]) => inArray(instance.region, filteredRegions) && inArray(instance.status, filteredStatuses),
  );

  return (
    <div className="rounded-md border">
      <div className="col md:row gap-4 px-3 py-4 md:items-center">
        <div className="row me-auto items-center gap-2 font-medium">
          <T id="title" />
          <HelpTooltip>
            <T id="helpTooltip" />
          </HelpTooltip>
        </div>

        <RegionFilter filters={filters} regions={regions} />
        <StatusFilter filters={filters} statuses={statuses} />
      </div>

      <div className="grid grid-cols-1 gap-3 bg-muted/50 p-4 sm:grid-cols-2 md:grid-cols-3">
        {filteredReplicas.map((instances) => (
          <Replica key={instances[0].id} instances={instances} />
        ))}
      </div>
    </div>
  );
}

type RegionFilterProps = {
  filters: UseFormReturn<Filters>;
  regions: string[];
};

function RegionFilter({ filters, regions }: RegionFilterProps) {
  return (
    <ControlledSelect
      control={filters.control}
      name="region"
      items={['all' as const, ...regions]}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      renderItem={(region) => {
        if (region === 'all') {
          return <T id="filters.allRegions" />;
        }

        return (
          <div className="row items-center gap-2">
            <RegionFlag regionId={region} className="size-4" />
            <RegionName regionId={region} />
          </div>
        );
      }}
      className="min-w-52"
    />
  );
}

type StatusFilterProps = {
  filters: UseFormReturn<Filters>;
  statuses: InstanceStatus[];
};

function StatusFilter({ filters, statuses }: StatusFilterProps) {
  return (
    <ControlledSelect
      control={filters.control}
      name="status"
      items={['all' as const, ...statuses]}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      renderItem={(status) => {
        if (status === 'all') {
          return <T id="filters.allStatuses" />;
        }

        return <div className="capitalize">{status}</div>;
      }}
      className="min-w-52"
    />
  );
}

function useReplicas(instances: Instance[]) {
  return useMemo(() => {
    // Map<region, Map<replicaIndex, Instance[]>>
    const map = new Map<string, Map<number, Instance[]>>();

    for (const instance of instances) {
      if (!map.has(instance.region)) {
        map.set(instance.region, new Map());
      }

      const regionMap = map.get(instance.region)!;

      if (!regionMap.has(instance.replicaIndex)) {
        regionMap.set(instance.replicaIndex, []);
      }

      regionMap.get(instance.replicaIndex)!.push(instance);
    }

    const result: Array<[Instance, ...Instance[]]> = [];

    for (const regionsMap of map.values()) {
      for (const instances of regionsMap.values()) {
        result.push(instances as [Instance, ...Instance[]]);
      }
    }

    return result.sort(([a], [b]) => {
      if (a.region !== b.region) {
        return a.region.localeCompare(b.region);
      }

      return a.replicaIndex - b.replicaIndex;
    });
  }, [instances]);
}

function Replica({ instances }: { instances: [Instance, ...Instance[]] }) {
  const instance = instances.find(hasProperty('status', 'healthy')) ?? instances[0];

  return (
    <div className="col min-w-0 gap-3 rounded-md border bg-neutral p-3">
      <div className="row items-center gap-2">
        <div className="font-medium">
          <T id="replicaIndex" values={{ index: instance.replicaIndex }} />
        </div>

        <RegionFlag regionId={instance.region} className="size-4" />

        <InstanceStatusBadge status={instance.status} className="ms-auto" />
      </div>

      <Tooltip allowHover content={instance.messages.join(' ')}>
        {(props) => (
          <div {...props} className="max-w-full self-start truncate text-dim">
            {instance.messages.join(' ')}
          </div>
        )}
      </Tooltip>

      <div className="border-t" />

      <div className="row flex-wrap gap-2">
        {instances.slice(0, 10).map((instance) => (
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
