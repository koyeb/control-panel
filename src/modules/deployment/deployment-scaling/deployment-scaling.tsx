import { Controller, useForm } from 'react-hook-form';

import { useDeploymentScalingQuery, useService, useServiceScaling } from 'src/api';
import { QueryGuard } from 'src/components/query-error';
import { RegionsSelector } from 'src/components/selectors/regions-selector';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';
import { ComputeDeployment } from 'src/model';

import { ManualScaling } from './manual-scaling';
import { ReplicaList } from './replica-list';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export type DeploymentScalingFilters = {
  regions: string[];
};

export function DeploymentScaling({ deployment }: { deployment: ComputeDeployment }) {
  const service = useService(deployment.serviceId);
  const isActiveDeployment = service?.activeDeploymentId === deployment.id;

  const filtersForm = useForm<DeploymentScalingFilters>({
    defaultValues: {
      regions: deployment.definition.regions,
    },
  });

  const query = useDeploymentScalingQuery(deployment, {
    filters: filtersForm.watch(),
  });

  const manualScaling = useServiceScaling(deployment.serviceId);

  return (
    <div id="scaling" className="m-4 mt-0 divide-y rounded-md border">
      <div className="row flex-wrap items-center justify-between gap-4 px-3 py-4">
        <div className="font-medium">
          <T id="title" />
        </div>

        <Controller
          control={filtersForm.control}
          name="regions"
          render={({ field }) => (
            <RegionsSelector
              label={<T id="filters.regions" />}
              regions={deployment.definition.regions}
              value={field.value}
              onChange={field.onChange}
              dropdown={{ floating: { placement: 'bottom-end' }, matchReferenceSize: false }}
              className="min-w-48"
            />
          )}
        />
      </div>

      <div className="col gap-3 p-3">
        <FeatureFlag feature="manual-scaling">
          {isActiveDeployment && (
            <ManualScaling
              deployment={deployment}
              defaultValue={manualScaling?.instances}
              onChanged={() => void query.refetch()}
            />
          )}
        </FeatureFlag>

        <QueryGuard query={query}>
          {(replicas) => <ReplicaList deployment={deployment} replicas={replicas} />}
        </QueryGuard>
      </div>
    </div>
  );
}
