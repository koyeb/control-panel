import { useState } from 'react';

import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance, OrganizationPlan } from 'src/api/model';
import { useGetInstanceQuota } from 'src/application/instance-quota';
import { useTrackEvent } from 'src/application/posthog';
import { Dialog } from 'src/components/dialog';

export function usePreSubmitServiceForm() {
  const openDialog = Dialog.useOpen();

  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();

  const organization = useOrganization();
  const getInstanceQuota = useGetInstanceQuota();
  const trackEvent = useTrackEvent();

  return [
    requiredPlan,
    (instance: CatalogInstance): boolean => {
      const quotas = getInstanceQuota(instance);
      const hasQuotas = quotas.used < quotas.max;

      if (instance?.category === 'gpu') {
        trackEvent('gpu_deployed', { plan: organization.plan, gpu_id: instance.identifier });
      }

      if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
        const plan = instance.plans[0] as OrganizationPlan;

        setRequiredPlan(plan);
        openDialog(`Upgrade-${plan}`);
        return false;
      } else if (!hasQuotas) {
        openDialog('QuotaIncreaseRequest');
        return false;
      }

      return true;
    },
  ] as const;
}
