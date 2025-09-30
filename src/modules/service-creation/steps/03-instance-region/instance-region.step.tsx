import { Button } from '@koyeb/design-system';

import { useInstancesCatalog, useOrganization, useRegionsCatalog } from 'src/api';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { LinkButton } from 'src/components/link';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ServiceType } from 'src/model';
import { useGetInstanceBadges } from 'src/modules/instance-selector/instance-badges';
import { InstanceCategoryTabs } from 'src/modules/instance-selector/instance-category-tabs';
import { InstanceSelector } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { hasProperty } from 'src/utils/object';

import { InstanceRegionAlerts } from './instance-region-alerts';

export function InstanceRegionStep() {
  const searchParams = useSearchParams();
  const navigate = useNavigate();

  const organization = useOrganization();

  const instances = useInstancesCatalog();
  const regions = useRegionsCatalog();

  const sourceType = useSearchParams().get('type');
  const serviceType = useSearchParams().get('service_type') as ServiceType;
  const availabilities = useInstanceAvailabilities({ serviceType });

  const instanceParam = searchParams.get('instance_type');
  const selectedInstance = instances.find(hasProperty('id', instanceParam)) ?? null;

  const regionsParam = searchParams.getAll('regions');
  const selectedRegions = regions.filter((region) => regionsParam.includes(region.id));

  const setInstanceParam = (instance: string) => {
    void navigate({
      to: '/services/new',
      search: (prev) => ({ ...prev, instance_type: instance }),
      replace: true,
    });
  };

  const setRegionsParam = (regions: string[]) => {
    void navigate({
      to: '/services/new',
      search: (prev) => ({ ...prev, regions }),
      replace: true,
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

      <div className="col max-h-[32rem] scrollbar-thin gap-3 overflow-auto rounded-md border p-2 scrollbar-green">
        <InstanceSelector {...selector} getBadges={getBadges} />
      </div>

      <div className="row gap-4">
        <LinkButton
          color="gray"
          to="/services/new"
          search={(prev) => ({
            ...prev,
            step: sourceType === 'git' ? 'builder' : 'importProject',
          })}
        >
          <Translate id="common.back" />
        </LinkButton>

        <Button
          onClick={() => {
            void navigate({ to: '/services/new', search: (prev) => ({ ...prev, step: 'review' }) });
          }}
          disabled={selectedRegions.length === 0}
        >
          <Translate id="common.next" />
        </Button>
      </div>
    </div>
  );
}
