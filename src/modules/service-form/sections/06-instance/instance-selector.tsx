import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { useInstance, useInstances, useRegion } from 'src/api/hooks/catalog';
import { CatalogInstance, InstanceCategory } from 'src/api/model';
import {
  useInstanceAvailabilities,
  useRegionAvailabilities,
} from 'src/application/instance-region-availability';
import { InstanceSelector as InstanceSelectorComponent } from 'src/components/instance-selector';
import { hasProperty } from 'src/utils/object';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { InstanceAlerts } from './instance-alerts';

export function InstanceSelector() {
  const instances = useInstances();

  const serviceType = useWatchServiceForm('serviceType');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const previousInstance = useInstance(useWatchServiceForm('meta.previousInstance'));

  const regions = useWatchServiceForm('regions');
  const firstRegion = useRegion(regions[0]);

  const instanceAvailabilities = useInstanceAvailabilities({ serviceType, hasVolumes, previousInstance });
  const regionAvailabilities = useRegionAvailabilities();

  const { getValues, setValue } = useFormContext<ServiceForm>();

  const { field } = useController<ServiceForm, 'instance'>({ name: 'instance' });
  const instance = useInstance(field.value);

  const [category, setCategory] = useState<InstanceCategory>(instance?.category ?? 'standard');

  const handleInstanceSelected = (instance: CatalogInstance | null) => {
    const [isAvailable] = instance ? (instanceAvailabilities[instance.identifier] ?? [false]) : [false];

    if (!instance || !isAvailable) {
      field.onChange(null);
      return;
    }

    field.onChange(instance.identifier);

    let availableRegions = getValues('regions')
      .filter((region) => regionAvailabilities[region]?.[0])
      .filter((region) => instance.regions?.includes(region));

    if (availableRegions.length === 0) {
      availableRegions = [instance?.regions?.[0] ?? 'fra'];
    }

    setValue('regions', availableRegions, { shouldValidate: true });
  };

  return (
    <>
      <InstanceAlerts selectedCategory={category} />

      <InstanceSelectorComponent
        instances={instances.filter(hasProperty('regionCategory', firstRegion?.category ?? 'koyeb'))}
        checkAvailability={(instance) => instanceAvailabilities[instance] ?? [false, 'instanceNotFound']}
        selectedInstance={instances.find(hasProperty('identifier', field.value)) ?? null}
        previousInstance={previousInstance}
        onInstanceSelected={handleInstanceSelected}
        onCategoryChanged={setCategory}
        className="w-full"
      />
    </>
  );
}
