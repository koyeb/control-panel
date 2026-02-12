import { Button } from '@koyeb/design-system';
import clsx from 'clsx';
import { useState } from 'react';
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

  const [initiateManualScaling, setInitiateManualScaling] = useState(false);
  const manualScaling = useServiceScaling(deployment.serviceId);
  const showManualScaling = Boolean(manualScaling) || initiateManualScaling;

  return (
    <div id="scaling" className="m-4 mt-0 divide-y rounded-md border">
      <div className="row flex-wrap items-center gap-4 px-3 py-4">
        <div className="me-auto font-medium">
          <T id="title" />
        </div>

        <FeatureFlag feature="manual-scaling">
          <Button
            color="gray"
            onClick={() => setInitiateManualScaling(true)}
            className={clsx({ invisible: !isActiveDeployment || showManualScaling })}
          >
            <T id="initiateManualScaling" />
          </Button>
        </FeatureFlag>

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
          {isActiveDeployment && showManualScaling && (
            <ManualScaling
              deployment={deployment}
              defaultValue={manualScaling?.instances}
              onChanged={() => {
                setInitiateManualScaling(false);
                void query.refetch();
              }}
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
