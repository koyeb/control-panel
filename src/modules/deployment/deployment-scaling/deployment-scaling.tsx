import { UseFormReturn, useController, useForm } from 'react-hook-form';

import { useDeploymentScalingQuery, useRegionsCatalog } from 'src/api';
import { QueryGuard } from 'src/components/query-error';
import { RegionsSelector } from 'src/components/selectors/regions-selector';
import { createTranslate } from 'src/intl/translate';
import { CatalogRegion, ComputeDeployment } from 'src/model';
import { getId } from 'src/utils/object';

import { ReplicaList } from './replica-list';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export type DeploymentScalingFilters = {
  regions: string[];
};

export function DeploymentScaling({ deployment }: { deployment: ComputeDeployment }) {
  const regions = useRegionsCatalog(deployment.definition.regions);

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

        <RegionFilter form={filtersForm} regions={regions} />
      </div>

      <div className="p-3">
        <QueryGuard query={query}>
          {(replicas) => <ReplicaList deployment={deployment} replicas={replicas} />}
        </QueryGuard>
      </div>
    </div>
  );
}

type RegionFilterProps = {
  form: UseFormReturn<DeploymentScalingFilters>;
  regions: CatalogRegion[];
};

function RegionFilter({ form, regions }: RegionFilterProps) {
  const { field } = useController({
    control: form.control,
    name: 'regions',
  });

  return (
    <RegionsSelector
      regions={regions}
      value={regions.filter((region) => field.value.includes(region.id))}
      onChange={(regions) => field.onChange(regions.map(getId))}
      label={<T id="filters.regions" />}
      dropdown={{ floating: { placement: 'bottom-end' }, matchReferenceSize: false }}
    />
  );
}
