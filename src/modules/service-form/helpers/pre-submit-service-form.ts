import { useState } from 'react';

import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import { CatalogInstance, OrganizationPlan } from 'src/api/model';
import { useTrackEvent } from 'src/application/posthog';

export function usePreSubmitServiceForm() {
  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();
  const [restrictedGpuDialogOpen, setRestrictedGpuDialogOpen] = useState(false);

  const organization = useOrganization();
  const quotas = useOrganizationQuotas();
  const trackEvent = useTrackEvent();

  return [
    [requiredPlan, setRequiredPlan],
    [restrictedGpuDialogOpen, setRestrictedGpuDialogOpen],
    (instance: CatalogInstance): boolean => {
      const isRestrictedGpu =
        instance?.category === 'gpu' &&
        quotas?.maxInstancesByType[instance.identifier] === 0 &&
        instance.status === 'restricted';

      if (instance?.category === 'gpu') {
        trackEvent('gpu_deployed', { plan: organization.plan, gpu_id: instance.identifier });
      }

      if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
        setRequiredPlan(instance.plans[0] as OrganizationPlan);
        return false;
      } else if (isRestrictedGpu) {
        setRestrictedGpuDialogOpen(true);
        return false;
      }

      return true;
    },
  ] as const;
}
