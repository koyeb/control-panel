import { Alert } from '@koyeb/design-system';

import { useCatalogInstance } from 'src/api';
import { createTranslate } from 'src/intl/translate';

import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.lifeCycle.alerts');

export function LifeCycleAlerts() {
  const serviceType = useWatchServiceForm('serviceType');
  const minScaling = useWatchServiceForm('scaling.min');
  const instance = useCatalogInstance(useWatchServiceForm('instance'));

  if (
    serviceType === 'worker' ||
    minScaling !== 0 ||
    instance?.id === 'free' ||
    instance?.category === 'gpu'
  ) {
    return <Alert variant="warning" description={<T id="noScaleToZero" />} />;
  }

  return null;
}
