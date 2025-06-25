import { Button } from '@koyeb/design-system';
import { Link, useSearch, useNavigate } from '@tanstack/react-router';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { ServiceType } from 'src/api/model';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { useMount } from 'src/hooks/lifecycle';
import { Translate } from 'src/intl/translate';
import { useGetInstanceBadges } from 'src/modules/instance-selector/instance-badges';
import { InstanceCategoryTabs } from 'src/modules/instance-selector/instance-category-tabs';
import { InstanceSelector } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { hasProperty, snakeToCamelDeep } from 'src/utils/object';

import { InstanceRegionAlerts } from './instance-region-alerts';

export function InstanceRegionStep() {
  const search = snakeToCamelDeep(useSearch({ from: '/_main/services/new' }));
  const navigate = useNavigate({ from: '/services/new' });

  const organization = useOrganization();

  const instances = useInstances();
  const regions = useRegions();

  const { serviceType } = snakeToCamelDeep(useSearch({ from: '/_main/services/new' }));
  const availabilities = useInstanceAvailabilities({ serviceType: serviceType as ServiceType });

  const instanceParam = search.instanceType;
  const selectedInstance = instances.find(hasProperty('id', instanceParam)) ?? null;

  const regionsParam = search.regions;
  const selectedRegions = regions.filter((region) => regionsParam?.includes(region.id));

  const setInstanceParam = (instance: string) => {
    void navigate({
      to: '.',
      replace: true,
      search: (prev) => ({
        ...prev,
        instance_type: instance,
      }),
    });
  };

  const setRegionsParam = (regions: string[]) => {
    void navigate({
      to: '.',
      replace: true,
      search: (prev) => ({ ...prev, regions }),
    });
  };

  const selector = useInstanceSelector({
    instances,
    regions,
    availabilities,
    selectedInstance,
    setSelectedInstance: (instance) => {
      if (instance !== null) {
        setInstanceParam(instance.id);
      }
    },
    selectedRegions,
    setSelectedRegions: (regions) => {
      setRegionsParam(regions.map((region) => region.id));
    },
  });

  const getBadges = useGetInstanceBadges();

  useMount(() => {
    if (!selectedInstance) {
      selector.onInstanceCategorySelected(organization.plan === 'hobby' ? 'eco' : 'standard');
    }
  });

  return (
    <div className="col max-w-4xl gap-4">
      <InstanceRegionAlerts selectedInstance={selectedInstance} selectedRegions={selectedRegions} />

      <InstanceCategoryTabs
        category={selector.instanceCategory}
        setCategory={selector.onInstanceCategorySelected}
      />

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="col scrollbar-green scrollbar-thin max-h-[32rem] gap-3 overflow-auto rounded-md border p-2">
        <InstanceSelector {...selector} getBadges={getBadges} />
      </div>

      <Link
        from="/services/new"
        search={(prev) => ({ ...prev, step: 'review' })}
        // todo: disabled state
        disabled={selectedRegions.length === 0}
        className={Button.className({}, 'self-start')}
      >
        <Translate id="common.next" />
      </Link>
    </div>
  );
}
