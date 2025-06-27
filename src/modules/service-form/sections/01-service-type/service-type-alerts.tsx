import { Alert } from '@koyeb/design-system';

import { useInstance } from 'src/api/hooks/catalog';
import { createTranslate } from 'src/intl/translate';

import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.serviceType.alerts');

export function ServiceTypeAlerts() {
  const instance = useInstance(useWatchServiceForm('instance'));

  if (instance?.id === 'free') {
    return (
      <Alert
        variant="info"
        style="outline"
        title={<T id="workerNotAvailableFreeInstanceTitle" values={{ instanceName: instance.displayName }} />}
        description={<T id="workerNotAvailableFreeInstanceDescription" />}
      />
    );
  }

  return null;
}
