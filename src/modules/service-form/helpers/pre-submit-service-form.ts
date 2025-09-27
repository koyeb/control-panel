import { useState } from 'react';

import { useOrganization } from 'src/api';
import { useGetInstanceQuota } from 'src/application/instance-quota';
import { useTrackEvent } from 'src/application/posthog';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { Dialog } from 'src/components/dialog';
import { tallyForms } from 'src/hooks/tally';
import { CatalogInstance, OrganizationPlan } from 'src/model';

export function usePreSubmitServiceForm(previousInstance?: string | null) {
  const openDialog = Dialog.useOpen();

  const organization = useOrganization();
  const getInstanceQuota = useGetInstanceQuota();
  const trackEvent = useTrackEvent();

  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();

  return [
    requiredPlan,
    (instance: CatalogInstance): boolean => {
      const quotas = getInstanceQuota(instance);
      const hasQuotas = previousInstance === instance.id || quotas.used < quotas.max;

      if (instance.category === 'gpu') {
        trackEvent('gpu_deployed', { plan: organization?.plan, gpu_id: instance.id });
      }

      if (hasQuotas) {
        return true;
      }

      if (isTenstorrentGpu(instance)) {
        if (organization?.plan === 'hobby') {
          setRequiredPlan('starter');
          openDialog('Upgrade', { plan: 'starter' });
        } else {
          window.open(`https://tally.so/r/${tallyForms.requestTenstorrentAccess}`);
        }

        return false;
      }

      if (instance.plans !== undefined && !instance.plans.includes(organization?.plan ?? '')) {
        const plan = instance.plans[0] as OrganizationPlan;

        setRequiredPlan(plan);
        openDialog('Upgrade', { plan });

        return false;
      }

      openDialog('QuotaIncreaseRequest');

      return false;
    },
  ] as const;
}
