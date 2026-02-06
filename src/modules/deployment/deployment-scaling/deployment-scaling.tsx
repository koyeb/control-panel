import { Controller, useForm } from 'react-hook-form';

import { useDeploymentScalingQuery } from 'src/api';
import { QueryGuard } from 'src/components/query-error';
import { RegionsSelector } from 'src/components/selectors/regions-selector';
import { createTranslate } from 'src/intl/translate';
import { ComputeDeployment } from 'src/model';

import { ReplicaList } from './replica-list';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export type DeploymentScalingFilters = {
  regions: string[];
};

export function DeploymentScaling({ deployment }: { deployment: ComputeDeployment }) {
  const filtersForm = useForm<DeploymentScalingFilters>({
    defaultValues: {
      regions: deployment.definition.regions,
    },
  });

  const query = useDeploymentScalingQuery(deployment, {
    filters: filtersForm.watch(),
  });

  return (
    <div className="m-4 mt-0 divide-y rounded-md border">
      <div className="row flex-wrap items-center gap-4 px-3 py-4">
        <div className="me-auto font-medium">
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

      <div className="p-3">
        <QueryGuard query={query}>
          {(replicas) => <ReplicaList deployment={deployment} replicas={replicas} />}
        </QueryGuard>
      </div>
    </div>
  );
}
