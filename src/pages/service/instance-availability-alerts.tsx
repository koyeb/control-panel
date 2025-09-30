import { Alert } from '@koyeb/design-system';

import {
  useCatalogInstance,
  useCatalogInstanceAvailability,
  useCatalogInstanceRegionsAvailability,
  useComputeDeployment,
  useDeploymentScaling,
} from 'src/api';
import { createTranslate } from 'src/intl/translate';
import { ComputeDeployment, Service } from 'src/model';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.service.layout.instanceAvailability');

type InstanceAvailabilityAlertsProps = {
  service: Service;
};

export function InstanceAvailabilityAlerts({ service }: InstanceAvailabilityAlertsProps) {
  const deployment = useComputeDeployment(service.activeDeploymentId);
  const instance = useCatalogInstance(deployment?.definition.instanceType);
  const canScaleToMax = useCanScaleToMax(deployment);

  const availability = useCatalogInstanceRegionsAvailability(
    deployment?.definition.instanceType,
    deployment?.definition.regions,
  );

  if (deployment?.status === 'SLEEPING' && availability === 'low') {
    return (
      <Alert
        variant="info"
        title={<T id="sleeping.title" values={{ instance: instance?.displayName }} />}
        description={<T id="sleeping.description" />}
      />
    );
  }

  if (!canScaleToMax) {
    return (
      <Alert
        variant="info"
        title={<T id="maxScale.title" values={{ instance: instance?.displayName }} />}
        description={<T id="maxScale.description" />}
      />
    );
  }

  return null;
}

function useCanScaleToMax(deployment?: ComputeDeployment) {
  const instanceAvailability = useCatalogInstanceAvailability(deployment?.definition.instanceType);
  const scaling = useDeploymentScaling(deployment?.id);

  if (deployment == undefined || scaling === undefined) {
    return true;
  }

  for (const region of deployment.definition.regions) {
    const availability = instanceAvailability?.byRegion.get(region);
    const replicas = scaling.filter(hasProperty('region', region));
    const activeReplicas = replicas.filter((replica) => replica.instances.length > 0);

    if (availability === 'low' && activeReplicas.length < replicas.length) {
      return false;
    }
  }

  return true;
}
