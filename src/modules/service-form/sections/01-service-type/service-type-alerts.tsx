import { Alert } from '@koyeb/design-system';
import { useInstance } from 'src/api/hooks/catalog';
import { Translate } from 'src/intl/translate';

import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.serviceType.alerts');

export function ServiceTypeAlerts() {
  const instanceIdentifier = useWatchServiceForm('instance.identifier');
  const instance = useInstance(instanceIdentifier);

  if (instance?.identifier === 'free') {
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
