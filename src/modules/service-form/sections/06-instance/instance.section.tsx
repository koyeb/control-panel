import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Badge } from '@koyeb/design-system';
import { useInstance, useInstances, useRegion } from 'src/api/hooks/catalog';
import { CatalogInstance, InstanceCategory } from 'src/api/model';
import {
  useInstanceAvailabilities,
  useRegionAvailabilities,
} from 'src/application/instance-region-availability';
import { InstanceSelector } from 'src/components/instance-selector';
import { createTranslate, Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { InstanceAlerts } from './instance-alerts';

const T = createTranslate('modules.serviceForm.instance');

export function InstanceSection() {
  const instances = useInstances();

  const serviceType = useWatchServiceForm('serviceType');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const previousInstance = useInstance(useWatchServiceForm('meta.previousInstance'));

  const regions = useWatchServiceForm('regions');
  const firstRegion = useRegion(regions[0]);

  const instanceAvailabilities = useInstanceAvailabilities({ serviceType, hasVolumes, previousInstance });
  const regionAvailabilities = useRegionAvailabilities();

  const { getValues, setValue, trigger } = useFormContext<ServiceForm>();

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

    if (instance.category === 'eco') {
      setValue('scaling.max', getValues('scaling.min'));
      void trigger('scaling');
    }

    if (instance.identifier === 'free') {
      setValue('scaling.min', 1);
      setValue('scaling.max', 1);
      void trigger('scaling');
    }

    let availableRegions = getValues('regions')
      .filter((region) => regionAvailabilities[region]?.[0])
      .filter((region) => instance.regions?.includes(region));

    if (availableRegions.length === 0) {
      availableRegions = [instance?.regions?.[0] ?? 'fra'];
    }

    setValue('regions', availableRegions, { shouldValidate: true });
  };

  return (
    <ServiceFormSection
      section="instance"
      title={<SectionTitle />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gap-6"
    >
      <InstanceAlerts selectedCategory={category} />

      <InstanceSelector
        instances={instances.filter(hasProperty('regionCategory', firstRegion?.category ?? 'koyeb'))}
        checkAvailability={(instance) => instanceAvailabilities[instance] ?? [false, 'instanceNotFound']}
        selectedInstance={instances.find(hasProperty('identifier', field.value)) ?? null}
        previousInstance={previousInstance}
        onInstanceSelected={handleInstanceSelected}
        onCategoryChanged={setCategory}
        className="w-full"
      />
    </ServiceFormSection>
  );
}

function SectionTitle() {
  const instance = useInstance(useWatchServiceForm('instance'));

  if (!instance) {
    return <T id="noInstanceSelected" />;
  }

  const spec = (
    <Translate
      id="common.instanceSpec"
      values={{ cpu: instance.cpu, ram: instance.ram, disk: instance.disk }}
    />
  );

  return (
    <>
      {instance.displayName}

      <span className="ml-1 inline-flex flex-row items-center gap-4 font-normal">
        <T id="instanceSpec" values={{ spec }} />
        <Badge color="green" size={1} className="capitalize">
          <T id={`category.${instance.category}`} />
        </Badge>
      </span>
    </>
  );
}
