import { useEffect, useState } from 'react';

import { useDeployments } from 'src/api/hooks/service';
import { Service } from 'src/api/model';
import { upcomingDeploymentStatuses } from 'src/application/service-functions';
import { IconRocket } from 'src/components/icons';
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

  return (
    <div className="row items-center gap-3 rounded-md border px-4 py-3">
      <div>
        <IconRocket className="size-5 stroke-1" />
      </div>

      <p>
        <T id="description" />
      </p>
    </div>
  );
}
