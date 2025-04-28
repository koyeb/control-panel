import { identity } from 'lodash-es';
import { useForm, UseFormReturn } from 'react-hook-form';

import { useRegions } from 'src/api/hooks/catalog';
import { useDeploymentScalingQuery } from 'src/api/hooks/service';
import { CatalogRegion, ComputeDeployment, InstanceStatus, Replica } from 'src/api/model';
import { ControlledSelect } from 'src/components/controlled';
import { QueryGuard } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { createTranslate, TranslateStatus } from 'src/intl/translate';
import { getId } from 'src/utils/object';

import { ReplicaList } from './replica-list';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export type DeploymentScalingFilters = {
  region: string | null;
  status: InstanceStatus | null;
};

export function DeploymentScaling({ deployment }: { deployment: ComputeDeployment }) {
  const regions = useRegions(deployment.definition.regions);

  const filters = useForm<DeploymentScalingFilters>({
    defaultValues: {
      region: null,
      status: null,
    },
  });

  const query = useDeploymentScalingQuery(deployment.id, {
    region: filters.watch('region') ?? undefined,
  });

  const filterReplicas = (replicas: Replica[]) => {
    return replicas.filter(
      (replica) => filters.watch('status') === null || replica.status === filters.watch('status'),
    );
  };

  return (
    <div className="m-4 mt-0 divide-y rounded-md border">
      <div className="row flex-wrap items-center gap-4 px-3 py-4">
        <div className="me-auto font-medium">
          <T id="title" />
        </div>

        <StatusFilter filters={filters} />
        <RegionFilter filters={filters} regions={regions} />
      </div>

      <div className="p-3">
        <QueryGuard query={query}>
          {(replicas) => <ReplicaList deployment={deployment} replicas={filterReplicas(replicas)} />}
        </QueryGuard>
      </div>
    </div>
  );
}

type StatusFilterProps = {
  filters: UseFormReturn<DeploymentScalingFilters>;
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
  filters: UseFormReturn<DeploymentScalingFilters>;
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
