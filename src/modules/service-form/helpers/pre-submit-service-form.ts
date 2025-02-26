import { useState } from 'react';

import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance, OrganizationPlan } from 'src/api/model';
import { useGetInstanceQuota } from 'src/application/instance-quota';
import { useTrackEvent } from 'src/application/posthog';
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
      const hasQuotas = previousInstance === instance.identifier || quotas.used < quotas.max;

      if (instance?.category === 'gpu') {
        trackEvent('gpu_deployed', { plan: organization.plan, gpu_id: instance.identifier });
      }

      if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
        const plan = instance.plans[0] as OrganizationPlan;

        setRequiredPlan(plan);
        openDialog(`Upgrade-${plan}`);
        return false;
      } else if (!hasQuotas) {
        if (isTenstorrentGpu(instance)) {
          tally.openPopup();
        } else {
          openDialog('QuotaIncreaseRequest');
        }

        return false;
      }

      return true;
    },
  ] as const;
}

function isTenstorrentGpu(instance: CatalogInstance) {
  return instance.identifier === 'gpu-tenstorrent-n300s' || instance.identifier === '4-gpu-tenstorrent-n300s';
}
