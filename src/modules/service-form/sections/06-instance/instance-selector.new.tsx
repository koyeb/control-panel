import { useController, useFormContext } from 'react-hook-form';

import { useInstance, useInstances, useRegions } from 'src/api/hooks/catalog';
import { CatalogInstance, CatalogRegion } from 'src/api/model';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { useGetInstanceBadges } from 'src/modules/instance-selector/instance-badges';
import { InstanceCategoryTabs } from 'src/modules/instance-selector/instance-category-tabs';
import { InstanceSelector as InstanceSelectorComponent } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { hasProperty } from 'src/utils/object';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { InstanceAlerts } from './instance-alerts';

export function InstanceSelectorNew() {
  const instances = useInstances();
  const regions = useRegions();

  const serviceType = useWatchServiceForm('serviceType');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const previousInstance = useInstance(useWatchServiceForm('meta.previousInstance'));

  const { getValues, setValue, trigger } = useFormContext<ServiceForm>();

  const instanceCtrl = useController<ServiceForm, 'instance'>({ name: 'instance' });
  const selectedInstance = instances.find(hasProperty('identifier', instanceCtrl.field.value)) ?? null;

  const regionsCtrl = useController<ServiceForm, 'regions'>({ name: 'regions' });
  const selectedRegions = regionsCtrl.field.value.map(
    (identifier) => regions.find(hasProperty('identifier', identifier))!,
  );

  const availabilities = useInstanceAvailabilities({ serviceType, hasVolumes, previousInstance });

  const getBadges = useGetInstanceBadges({ previousInstance });

  const handleInstanceSelected = (instance: CatalogInstance | null) => {
    instanceCtrl.field.onChange(instance?.identifier ?? null);

    if (instance?.identifier === 'free') {
      setValue('scaling.min', 1);
      setValue('scaling.max', 1);
      void trigger('scaling');
    } else if (instance?.category === 'eco') {
      setValue('scaling.max', getValues('scaling.min'));
      void trigger('scaling');
    }
  };

  const handleRegionsSelected = (regions: CatalogRegion[]) => {
    regionsCtrl.field.onChange(regions.map((region) => region.identifier));
  };

  const selector = useInstanceSelector({
    instances,
    regions,
    availabilities,
    selectedInstance,
    setSelectedInstance: handleInstanceSelected,
    selectedRegions,
    setSelectedRegions: handleRegionsSelected,
  });

  return (
    <>
      <InstanceCategoryTabs
        category={selector.instanceCategory}
        setCategory={selector.onInstanceCategorySelected}
      />

      <InstanceAlerts selectedCategory={selector.instanceCategory} />

      <div className="col scrollbar-green scrollbar-thin max-h-96 gap-3 overflow-auto pe-2">
        <InstanceSelectorComponent {...selector} getBadges={getBadges} />
        <div />
      </div>
    </>
  );
}
