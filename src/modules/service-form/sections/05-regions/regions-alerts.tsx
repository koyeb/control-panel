import { useFormContext, useFormState } from 'react-hook-form';

import { Alert } from '@koyeb/design-system';
import { useInstance, useRegion } from 'src/api/hooks/catalog';
import { DocumentationLink } from 'src/components/documentation-link';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.regions.alerts');

export function RegionsAlerts() {
  const { setValue } = useFormContext<ServiceForm>();

  const { errors } = useFormState<ServiceForm>();
  const error = errors.regions?.message;

  const instanceType = useWatchServiceForm('instance.identifier');
  const instance = useInstance(instanceType);

  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;

  const fra = useRegion('fra')?.displayName;
  const sin = useRegion('sin')?.displayName;
  const was = useRegion('was')?.displayName;

  if (error === 'noRegionSelected') {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="noRegionSelectedTitle" />}
        description={<T id="noRegionSelectedDescription" />}
      />
    );
  }

  if (instance?.identifier === 'free') {
    return (
      <Alert
        variant="info"
        style="outline"
        title={<T id="freeInstanceTitle" values={{ instanceName: instance.displayName, fra, was }} />}
        description={<T id="freeInstanceDescription" />}
      />
    );
  }

  if (instance?.category === 'eco') {
    return (
      <Alert
        variant="info"
        style="outline"
        title={<T id="ecoInstancesTitle" values={{ instanceName: instance.displayName, fra, sin, was }} />}
        description={<T id="ecoInstancesDescription" />}
      />
    );
  }

  if (hasVolumes) {
    return (
      <Alert
        variant="info"
        style="outline"
        title={<T id="hasVolumesTitle" />}
        description={
          <T
            id="hasVolumesDescription"
            values={{
              volumesLink: (children) => (
                <button
                  type="button"
                  className="underline"
                  onClick={() => setValue('meta.expandedSection', 'volumes')}
                >
                  {children}
                </button>
              ),
              documentationLink: (children) => (
                <DocumentationLink path="/docs/reference/volumes" className="!text-default underline">
                  {children}
                </DocumentationLink>
              ),
            }}
          />
        }
      />
    );
  }

  return null;
}
