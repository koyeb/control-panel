import { Button } from '@koyeb/design-system';
import { useInstancesQuery, useRegionsQuery } from 'src/api/hooks/catalog';
import { useOrganizationQuotasQuery, useOrganizationSummaryQuery } from 'src/api/hooks/session';
import { ServiceType } from 'src/api/model';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { InstanceSelector } from 'src/components/instance-selector';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

import { InstanceRegionAlerts } from './instance-region-alerts';
import { useInstanceRegionState } from './instance-region-state';
import { RegionsSelector } from './regions-selector';

type InstanceRegionStepProps = {
  onNext: () => void;
};

export function InstanceRegionStep(props: InstanceRegionStepProps) {
  const instancesQuery = useInstancesQuery();
  const regionsQuery = useRegionsQuery();
  const organizationSummaryQuery = useOrganizationSummaryQuery();
  const organizationQuotasQuery = useOrganizationQuotasQuery();

  if (
    instancesQuery.isPending ||
    regionsQuery.isPending ||
    organizationSummaryQuery.isPending ||
    organizationQuotasQuery.isPending
  ) {
    return <Loading />;
  }

  if (organizationSummaryQuery.isError) {
    return <QueryError error={organizationSummaryQuery.error} />;
  }

  if (organizationQuotasQuery.isError) {
    return <QueryError error={organizationQuotasQuery.error} />;
  }

  return <InstanceRegionStep_ {...props} />;
}

function InstanceRegionStep_({ onNext }: InstanceRegionStepProps) {
  const [serviceType] = useSearchParam('service_type') as [ServiceType, unknown];
  const [state, actions] = useInstanceRegionState();
  const navigate = useNavigate();

  const availabilities = useInstanceAvailabilities({ serviceType });

  useMount(() => {
    navigate((url) => {
      url.searchParams.delete('instance_type');
      url.searchParams.delete('regions');
    });
  });

  return (
    <>
      <InstanceRegionAlerts
        selectedInstance={state.selectedInstance}
        selectedRegions={state.selectedRegions}
      />

      <div className="col lg:row items-center gap-8 lg:gap-4">
        <InstanceSelector
          instances={state.instances}
          selectedInstance={state.selectedInstance}
          checkAvailability={(instance) => availabilities[instance] ?? [false, 'instanceNotFound']}
          onInstanceSelected={actions.instanceSelected}
          className="w-full max-w-xl"
        />

        <RegionsSelector
          regions={state.regions}
          selectedInstance={state.selectedInstance}
          selectedRegions={state.selectedRegions}
          onRegionSelected={actions.regionSelected}
        />
      </div>

      <Button
        onClick={() => {
          navigate((url) => {
            url.searchParams.set('instance_type', state.selectedInstance?.identifier ?? 'nano');
            state.selectedRegions.forEach((region) => url.searchParams.append('regions', region.identifier));
          });

          onNext();
        }}
        disabled={state.selectedRegions.length === 0}
        className="self-start"
      >
        <Translate id="common.next" />
      </Button>
    </>
  );
}
