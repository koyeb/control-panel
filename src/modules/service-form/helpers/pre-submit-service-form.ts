import { useOrganization } from 'src/api';
import { useGetInstanceQuota } from 'src/application/instance-quota';
import { useTrackEvent } from 'src/application/posthog';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { openDialog } from 'src/components/dialog';
import { tallyForms } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';
import { CatalogInstance, OrganizationPlan } from 'src/model';

export function usePreSubmitServiceForm(form: HTMLFormElement | null, previousInstance?: string | null) {
  // re-render with new organization plan before submitting
  const openUpgradeDialog = useOpenUpgradeDialog(() => setTimeout(() => form?.requestSubmit()));

  const organization = useOrganization();
  const getInstanceQuota = useGetInstanceQuota();
  const trackEvent = useTrackEvent();

  return (instance: CatalogInstance): boolean => {
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
        openUpgradeDialog('starter');
      } else {
        window.open(`https://tally.so/r/${tallyForms.requestTenstorrentAccess}`);
      }

      return false;
    }

    if (instance.plans !== undefined && !instance.plans.includes(organization?.plan ?? '')) {
      openUpgradeDialog(instance.plans[0] as OrganizationPlan);

      return false;
    }

    openDialog('RequestQuotaIncrease', instance);

    return false;
  };
}

const T = createTranslate('modules.serviceForm.upgradeDialog');
const TEnum = createTranslate('enums');

function useOpenUpgradeDialog(onPlanChanged: () => void) {
  const t = T.useTranslate();
  const translateEnum = TEnum.useTranslate();

  return (plan: OrganizationPlan) => {
    openDialog('Upgrade', {
      plan: 'starter',
      description: t('description', { plan: translateEnum(`plans.${plan}`) }),
      submit: t('submit'),
      onPlanChanged: onPlanChanged,
    });
  };
}
