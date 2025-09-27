import { useEffect, useState } from 'react';

import { useDeployments, useOrganization } from 'src/api';
import { upcomingDeploymentStatuses } from 'src/application/service-functions';
import { IconRocket } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { OrganizationPlan, Service } from 'src/model';
import { inArray, last } from 'src/utils/arrays';

const T = createTranslate('pages.service.layout.deploymentThrottled');

type DeploymentThrottledAlertProps = {
  service: Service;
};

export function DeploymentThrottledAlert({ service }: DeploymentThrottledAlertProps) {
  const organization = useOrganization();
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

  if (!throttled || !inArray<OrganizationPlan>(organization?.plan, ['hobby', 'starter'])) {
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
