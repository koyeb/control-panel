import { useEffect, useState } from 'react';

import { Alert } from '@koyeb/design-system';
import { useDeployments } from 'src/api/hooks/service';
import { Service } from 'src/api/model';
import { upcomingDeploymentStatuses } from 'src/application/service-functions';
import { createTranslate } from 'src/intl/translate';
import { last } from 'src/utils/arrays';

const T = createTranslate('pages.service.layout.deploymentThrottled');

type DeploymentThrottledAlertProps = {
  service: Service;
};

export function DeploymentThrottledAlert({ service }: DeploymentThrottledAlertProps) {
  const upcomingDeployments = useDeployments(service.id, upcomingDeploymentStatuses);
  const lastUpcoming = last(upcomingDeployments ?? []);

  const [throttled, setThrottled] = useState(false);

  useEffect(() => {
    setThrottled(false);
  }, [lastUpcoming]);

  useEffect(() => {
    if (lastUpcoming?.status === 'PENDING') {
      const timeout = setTimeout(() => setThrottled(true), 10_000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [lastUpcoming]);

  if (!throttled) {
    return null;
  }

  return <Alert variant="warning" description={<T id="description" />} />;
}
