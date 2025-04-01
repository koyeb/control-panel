import { Alert } from '@koyeb/design-system';
import { useCatalogInstanceRegionsAvailability, useInstance } from 'src/api/hooks/catalog';
import { useComputeDeployment } from 'src/api/hooks/service';
import { Service } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.layout.instanceAvailability');

type InstanceAvailabilityAlertProps = {
  service: Service;
};

export function InstanceAvailabilityAlert({ service }: InstanceAvailabilityAlertProps) {
  const deployment = useComputeDeployment(service.activeDeploymentId);
  const instance = useInstance(deployment?.definition.instanceType);

  const availability = useCatalogInstanceRegionsAvailability(
    deployment?.definition.instanceType,
    deployment?.definition.regions,
  );

  if (deployment?.status === 'sleeping' && availability === 'low') {
    return (
      <Alert
        variant="info"
        title={<T id="title" values={{ instance: instance?.displayName }} />}
        description={<T id="description" />}
      />
    );
  }

  return null;
}
