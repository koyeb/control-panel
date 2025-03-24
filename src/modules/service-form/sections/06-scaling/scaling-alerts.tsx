import { useFormContext, useFormState } from 'react-hook-form';

import { Alert } from '@koyeb/design-system';
import { useInstance } from 'src/api/hooks/catalog';
import { DocumentationLink } from 'src/components/documentation-link';
import { IconMoon } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.scaling.alerts');

export function ScalingAlerts() {
  const { setValue } = useFormContext<ServiceForm>();

  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling;

  const instance = useInstance(useWatchServiceForm('instance'));
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;

  if (error?.message === 'noTargetSelected') {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="noTargetAlertTitle" />}
        description={<T id="noTargetAlertDescription" />}
      />
    );
  }

  if (instance?.id === 'free') {
    return (
      <Alert
        variant="info"
        icon={<IconMoon className="size-6" />}
        style="outline"
        title={<T id="freeInstanceAlertTitle" />}
        description={<T id="freeInstanceAlertDescription" values={{ instanceName: instance.displayName }} />}
      />
    );
  }

  if (instance?.category === 'eco') {
    return (
      <Alert
        variant="info"
        style="outline"
        title={<T id="ecoInstanceAlertTitle" values={{ instanceName: instance.displayName }} />}
        description={<T id="ecoInstanceAlertDescription" />}
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
