import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { useInstance, useInstances, useRegions } from 'src/api/hooks/catalog';
import { CatalogInstance, CatalogRegion, InstanceCategory } from 'src/api/model';
import { useIsInstanceAvailable, useIsRegionAvailable } from 'src/application/instance-region-availability';
import { useGetInstanceBadges } from 'src/modules/instance-selector/instance-badges';
import { InstanceCategoryTabs } from 'src/modules/instance-selector/instance-category-tabs';
import { InstanceSelector as InstanceSelectorComponent } from 'src/modules/instance-selector/instance-selector';
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

  const selectedRegions = useWatchServiceForm('regions').map(
    (identifier) => regions.find(hasProperty('identifier', identifier))!,
  );

  const { getValues, setValue, trigger } = useFormContext<ServiceForm>();

  const { field } = useController<ServiceForm, 'instance'>({ name: 'instance' });
  const instance = useInstance(field.value);

  const [category, setCategory] = useState<InstanceCategory>(instance?.category ?? 'standard');

  const isInstanceAvailable = useIsInstanceAvailable({ serviceType, hasVolumes, previousInstance });
  const isRegionAvailable = useIsRegionAvailable({ instance });

  const handleInstanceSelected = (instance: CatalogInstance | null) => {
    if (!instance || !isInstanceAvailable(instance)) {
      field.onChange(null);
      return;
    }

    field.onChange(instance.identifier);

    if (instance.category === 'eco') {
      setValue('scaling.max', getValues('scaling.min'));
      void trigger('scaling');
    }

    if (instance.identifier === 'free') {
      setValue('scaling.min', 1);
      setValue('scaling.max', 1);
      void trigger('scaling');
    }
  };

  const handleRegionsSelected = (regions: CatalogRegion[]) => {
    setValue(
      'regions',
      regions.map((region) => region.identifier),
      { shouldValidate: true },
    );
  };

  const getBadges = useGetInstanceBadges({
    previousInstance: useInstance(useFormContext<ServiceForm>().watch('meta.previousInstance')),
  });

  return (
    <>
      <InstanceCategoryTabs
        category={category}
        setCategory={setCategory}
        instances={instances.filter(hasProperty('regionCategory', 'koyeb')).filter(isInstanceAvailable)}
        setInstance={handleInstanceSelected}
      />

      <InstanceAlerts selectedCategory={category} />

      <InstanceSelectorComponent
        instances={instances
          .filter(hasProperty('regionCategory', 'koyeb'))
          .filter(hasProperty('category', category))
          .filter(isInstanceAvailable)}
        selectedInstance={instances.find(hasProperty('identifier', field.value)) ?? null}
        onInstanceSelected={handleInstanceSelected}
        regions={regions.filter(isRegionAvailable)}
        selectedRegions={selectedRegions}
        onRegionsSelected={handleRegionsSelected}
        getBadges={getBadges}
      />
    </>
  );
}
