import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@koyeb/design-system';
import {
  useDatacenters,
  useInstances,
  useInstancesQuery,
  useRegions,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import {
  useOrganization,
  useOrganizationQuotasQuery,
  useOrganizationSummaryQuery,
} from 'src/api/hooks/session';
import { ServiceType } from 'src/api/model';
import { getDefaultRegion } from 'src/application/default-region';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParam, useSearchParams } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { useGetInstanceBadges } from 'src/modules/instance-selector/instance-badges';
import { InstanceCategoryTabs } from 'src/modules/instance-selector/instance-category-tabs';
import { InstanceSelector } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { hasProperty } from 'src/utils/object';

import { InstanceRegionAlerts } from './instance-region-alerts';

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
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const navigate = useNavigate();

  const instances = useInstances();
  const regions = useRegions();
  const datacenters = useDatacenters();

  const [serviceType] = useSearchParam('service_type') as [ServiceType, unknown];
  const availabilities = useInstanceAvailabilities({ serviceType });

  const selectedInstance =
    instances.find(hasProperty('identifier', searchParams.get('instance_type'))) ?? null;

  const selectedRegions = regions.filter((region) =>
    searchParams.getAll('regions').includes(region.identifier),
  );

  const organization = useOrganization();

  const setInstanceParam = (instance: string) => {
    navigate((url) => url.searchParams.set('instance_type', instance), { replace: true });
  };

  const setRegionsParam = (regions: string[]) => {
    navigate(
      (url) => {
        url.searchParams.delete('regions');
        regions.forEach((region) => url.searchParams.append('regions', region));
      },
      { replace: true },
    );
  };

  useMount(() => {
    let instance = searchParams.get('instance_type');

    if (!searchParams.has('instance_type')) {
      instance = organization.plan === 'hobby' ? 'free' : 'nano';
      setInstanceParam(instance);

      if (instance === 'free') {
        selector.onInstanceCategorySelected('eco');
      }
    }

    if (!searchParams.has('regions')) {
      const defaultRegion = getDefaultRegion(
        queryClient,
        datacenters,
        regions,
        instances.find(hasProperty('identifier', instance)),
      );

      setRegionsParam(defaultRegion ? [defaultRegion.identifier] : ['fra']);
    }
  });

  const getBadges = useGetInstanceBadges();

  const selector = useInstanceSelector({
    instances,
    regions,
    availabilities,
    selectedInstance,
    setSelectedInstance: (instance) => {
      if (instance !== null) {
        setInstanceParam(instance.identifier);
      }
    },
    selectedRegions,
    setSelectedRegions: (regions) => {
      setRegionsParam(regions.map((region) => region.identifier));
    },
  });

  return (
    <div className="col max-w-3xl gap-4">
      <InstanceRegionAlerts selectedInstance={selectedInstance} selectedRegions={selectedRegions} />

      <InstanceCategoryTabs
        category={selector.instanceCategory}
        setCategory={selector.onInstanceCategorySelected}
      />

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="col scrollbar-green scrollbar-thin max-h-[32rem] gap-3 overflow-auto rounded-md border p-2">
        <InstanceSelector {...selector} getBadges={getBadges} />
      </div>

      <Button onClick={onNext} disabled={selectedRegions.length === 0} className="self-start">
        <Translate id="common.next" />
      </Button>
    </div>
  );
}
