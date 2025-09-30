import { useRef } from 'react';
import { useController } from 'react-hook-form';

import { useCatalogInstance, useInstancesCatalog, useRegionsCatalog } from 'src/api';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { CatalogInstance, CatalogRegion } from 'src/model';
import { useGetInstanceBadges } from 'src/modules/instance-selector/instance-badges';
import { InstanceCategoryTabs } from 'src/modules/instance-selector/instance-category-tabs';
import { InstanceSelector as InstanceSelectorComponent } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { hasProperty } from 'src/utils/object';

import { useScalingRules } from '../../helpers/scaling-rules';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { InstanceAlerts } from './instance-alerts';

export function InstanceSelector() {
  const instances = useInstancesCatalog();
  const regions = useRegionsCatalog();

  const isServiceEdition = useWatchServiceForm('meta.serviceId') !== null;
  const serviceType = useWatchServiceForm('serviceType');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const previousInstance = useCatalogInstance(useWatchServiceForm('meta.previousInstance'));

  const instanceCtrl = useController<ServiceForm, 'instance'>({ name: 'instance' });
  const selectedInstance = instances.find(hasProperty('id', instanceCtrl.field.value)) ?? null;

  const regionsCtrl = useController<ServiceForm, 'regions'>({ name: 'regions' });
  const selectedRegions = regionsCtrl.field.value.map((id) => regions.find(hasProperty('id', id))!);
  const originalSelectedRegions = useRef(selectedRegions);

  const availabilities = useInstanceAvailabilities({ serviceType, hasVolumes, previousInstance });

  const getBadges = useGetInstanceBadges({ previousInstance });

  const scaling = useScalingRules();

  const handleInstanceSelected = (instance: CatalogInstance | null) => {
    instanceCtrl.field.onChange(instance?.id ?? null);
    scaling.onInstanceChanged(selectedInstance, instance);
  };

  const handleRegionsSelected = (regions: CatalogRegion[]) => {
    regionsCtrl.field.onChange(regions.map((region) => region.id));
  };

  const selector = useInstanceSelector({
    instances,
    regions: isServiceEdition && hasVolumes ? originalSelectedRegions.current : regions,
    availabilities,
    selectedInstance,
    setSelectedInstance: handleInstanceSelected,
    selectedRegions,
    setSelectedRegions: handleRegionsSelected,
  });

  if (isServiceEdition && hasVolumes && selectedInstance?.category === 'gpu') {
    return (
      <div className="mb-4">
        <InstanceAlerts selectedCategory={selector.instanceCategory} />
      </div>
    );
  }

  return (
    <>
      <InstanceCategoryTabs
        category={selector.instanceCategory}
        setCategory={selector.onInstanceCategorySelected}
      />

      <InstanceAlerts selectedCategory={selector.instanceCategory} />

      <div className="col max-h-96 scrollbar-thin gap-3 overflow-auto pe-2 scrollbar-green">
        <InstanceSelectorComponent {...selector} getBadges={getBadges} />
        <div />
      </div>
    </>
  );
}
