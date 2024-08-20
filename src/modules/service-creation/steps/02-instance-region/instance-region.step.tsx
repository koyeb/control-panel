import { Button } from '@koyeb/design-system';
import { useOrganizationQuotasQuery, useOrganizationSummaryQuery } from 'src/api/hooks/session';
import { ServiceType } from 'src/api/model';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { InstanceSelector } from 'src/components/instance-selector';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

import { InstanceRegionAlerts } from './instance-region-alerts';
import { useInstanceRegionState } from './instance-region-state';
import { RegionsSelector } from './regions-selector';

type InstanceRegionStepProps = {
  onNext: () => void;
};

export function InstanceRegionStep(props: InstanceRegionStepProps) {
  const organizationSummaryQuery = useOrganizationSummaryQuery();
  const organizationQuotasQuery = useOrganizationQuotasQuery();

  if (organizationSummaryQuery.isPending || organizationQuotasQuery.isPending) {
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

  return (
    <>
      <InstanceRegionAlerts selectedInstance={state.instance} selectedRegions={state.regions} />

      <div className="col 2xl:row gap-8">
        <InstanceSelector
          selectedCategory={state.instanceCategory}
          selectedInstance={state.instance}
          checkAvailability={(instance) => availabilities[instance] ?? [false, 'instanceNotFound']}
          onCategorySelected={actions.instanceCategorySelected}
          onInstanceSelected={actions.instanceSelected}
          className="max-w-lg lg:w-full"
        />

        <RegionsSelector
          selectedInstance={state.instance}
          selectedRegions={state.regions}
          onRegionSelected={actions.regionSelected}
        />
      </div>

      <Button
        onClick={() => {
          navigate((url) => {
            url.searchParams.set('instance_type', state.instance);
            state.regions.forEach((region) => url.searchParams.append('regions', region));
          });

          onNext();
        }}
        className="self-start"
      >
        <Translate id="common.next" />
      </Button>
    </>
  );
}
