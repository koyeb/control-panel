import { useState } from 'react';

import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance, OrganizationPlan } from 'src/api/model';
import { useGetInstanceQuota } from 'src/application/instance-quota';
import { useTrackEvent } from 'src/application/posthog';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { Dialog } from 'src/components/dialog';
import { tallyForms, useTallyDialog } from 'src/hooks/tally';

export function usePreSubmitServiceForm(previousInstance?: string | null) {
  const openDialog = Dialog.useOpen();
  const tally = useTallyDialog(tallyForms.tenstorrentRequest);

  const organization = useOrganization();
  const getInstanceQuota = useGetInstanceQuota();
  const trackEvent = useTrackEvent();

  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();

  return [
    requiredPlan,
    (instance: CatalogInstance): boolean => {
      const quotas = getInstanceQuota(instance);
      const hasQuotas = previousInstance === instance.id || quotas.used < quotas.max;

      if (instance?.category === 'gpu') {
        trackEvent('gpu_deployed', { plan: organization.plan, gpu_id: instance.id });
      }

      if (hasQuotas) {
        return true;
      }

      if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
        const plan = instance.plans[0] as OrganizationPlan;

        setRequiredPlan(plan);
        openDialog('Upgrade', { plan });
      } else if (isTenstorrentGpu(instance)) {
        tally.openPopup();
      } else {
        openDialog('QuotaIncreaseRequest');
      }

      return false;
    },
  ] as const;
}
