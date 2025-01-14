import { useState } from 'react';

import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import { CatalogInstance, OrganizationPlan } from 'src/api/model';
import { useTrackEvent } from 'src/application/posthog';
import { Dialog } from 'src/components/dialog';

export function usePreSubmitServiceForm() {
  const openDialog = Dialog.useOpen();

  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();

  const organization = useOrganization();
  const quotas = useOrganizationQuotas();
  const trackEvent = useTrackEvent();

  return [
    requiredPlan,
    (instance: CatalogInstance): boolean => {
      const isRestrictedGpu =
        instance?.category === 'gpu' &&
        quotas?.maxInstancesByType[instance.identifier] === 0 &&
        instance.status === 'restricted';

      if (instance?.category === 'gpu') {
        trackEvent('gpu_deployed', { plan: organization.plan, gpu_id: instance.identifier });
      }

      if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
        const plan = instance.plans[0] as OrganizationPlan;

        setRequiredPlan(plan);
        openDialog(`Upgrade-${plan}`);
        return false;
      } else if (isRestrictedGpu) {
        openDialog('RestrictedGpu');
        return false;
      }

      return true;
    },
  ] as const;
}
