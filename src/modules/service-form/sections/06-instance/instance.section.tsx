import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Badge } from '@koyeb/design-system';
import { useInstance, useInstances, useRegion } from 'src/api/hooks/catalog';
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
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const previousInstance = useInstance(useWatchServiceForm('meta.previousInstance'));

  const regions = useWatchServiceForm('regions');
  const firstRegion = useRegion(regions[0]);

  const availabilities = useInstanceAvailabilities({
    serviceType,
    hasVolumes,
    previousInstance,
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
            instances={instances.filter(hasProperty('regionCategory', firstRegion?.category ?? 'koyeb'))}
            checkAvailability={(instance) => availabilities[instance] ?? [false, 'instanceNotFound']}
            selectedInstance={instances.find(hasProperty('identifier', field.value)) ?? null}
            onInstanceSelected={(instance) => field.onChange(instance?.identifier ?? null)}
            className="w-full"
          />
        )}
      />
    </ServiceFormSection>
  );
}

function useUnsetInstanceWhenNotAvailable(availabilities: Record<string, InstanceAvailability>) {
  const { setValue } = useFormContext<ServiceForm>();
  const instanceIdentifier = useFormValues<ServiceForm>().instance;

  useEffect(() => {
    if (!instanceIdentifier) {
      return;
    }

    const [isAvailable] = availabilities[instanceIdentifier] ?? [];

    if (!isAvailable) {
      setValue('instance', null);
    }
  }, [instanceIdentifier, availabilities, setValue]);
}

function useUpdateRegionsWhenInstanceChanges() {
  const { getValues, setValue } = useFormContext<ServiceForm>();

  const instance = useInstance(useWatchServiceForm('instance'));
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
