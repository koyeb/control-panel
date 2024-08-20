import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Badge } from '@koyeb/design-system';
import { useInstance, useInstances } from 'src/api/hooks/catalog';
import {
  InstanceAvailability,
  useInstanceAvailabilities,
  useRegionAvailabilities,
} from 'src/application/instance-region-availability';
import { InstanceSelector } from 'src/components/instance-selector';
import { useFormValues } from 'src/hooks/form';
import { useUpdateEffect } from 'src/hooks/lifecycle';
import { Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { InstanceAlerts } from './instance-alerts';

const T = Translate.prefix('serviceForm.instance');

export function InstanceSection() {
  const instances = useInstances();

  const serviceType = useWatchServiceForm('serviceType');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.volumeId !== '').length > 0;
  const allowFreeInstanceIfAlreadyUsed = useWatchServiceForm('meta.allowFreeInstanceIfAlreadyUsed');

  const availabilities = useInstanceAvailabilities({
    serviceType,
    hasVolumes,
    allowFreeInstanceIfAlreadyUsed,
  });

  useUnsetInstanceWhenNotAvailable(availabilities);
  useUpdateRegionsWhenInstanceChanges();

  return (
    <ServiceFormSection
      section="instance"
      title={<SectionTitle />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gap-6"
    >
      <InstanceAlerts />

      <Controller<ServiceForm, 'instance'>
        name="instance"
        render={({ field }) => (
          <InstanceSelector
            selectedCategory={field.value.category}
            checkAvailability={(instance) => availabilities[instance] ?? [false, 'instanceNotFound']}
            onCategorySelected={(category) => {
              const availableInstancesInCategory = instances
                .filter(hasProperty('category', category))
                .filter((instance) => availabilities[instance.identifier]?.[0]);

              field.onChange({
                category,
                identifier: availableInstancesInCategory[0]?.identifier ?? null,
              } satisfies ServiceForm['instance']);
            }}
            selectedInstance={field.value.identifier}
            onInstanceSelected={(identifier) => {
              const instance = instances.find(hasProperty('identifier', identifier));

              if (!instance) {
                return;
              }

              field.onChange({
                category: instance.category,
                identifier: instance.identifier,
              } satisfies ServiceForm['instance']);
            }}
            className="w-full"
          />
        )}
      />
    </ServiceFormSection>
  );
}

function useUnsetInstanceWhenNotAvailable(availabilities: Record<string, InstanceAvailability>) {
  const { setValue } = useFormContext<ServiceForm>();
  const instanceIdentifier = useFormValues<ServiceForm>().instance.identifier;

  useEffect(() => {
    if (!instanceIdentifier) {
      return;
    }

    const [isAvailable] = availabilities[instanceIdentifier] ?? [];

    if (!isAvailable) {
      setValue('instance.identifier', null);
    }
  }, [instanceIdentifier, availabilities, setValue]);
}

function useUpdateRegionsWhenInstanceChanges() {
  const { getValues, setValue } = useFormContext<ServiceForm>();

  const instanceIdentifier = useWatchServiceForm('instance.identifier');
  const instance = useInstance(instanceIdentifier);

  const regionAvailabilities = useRegionAvailabilities();

  useUpdateEffect(() => {
    let availableRegions = getValues('regions')
      .filter((region) => regionAvailabilities[region]?.[0])
      .filter((region) => instance?.regions?.includes(region));

    if (availableRegions.length === 0) {
      availableRegions = [instance?.regions?.[0] ?? 'fra'];
    }

    setValue('regions', availableRegions, { shouldValidate: true });
  }, [instance, regionAvailabilities, getValues, setValue]);
}

const SectionTitle = () => {
  const instanceType = useWatchServiceForm('instance.identifier');
  const instance = useInstance(instanceType);

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
};
