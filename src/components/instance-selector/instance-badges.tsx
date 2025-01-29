import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance } from 'src/api/model';
import { useGetHasInstanceQuota } from 'src/application/instance-quota';

import { InstanceSelectorBadge } from './instance-selector';

type UseGetInstanceBadgesOptions = {
  previousInstance?: CatalogInstance;
  bestFit?: boolean;
  insufficientVRam?: boolean;
};

export function useGetInstanceBadges(options: UseGetInstanceBadgesOptions) {
  const organization = useOrganization();
  const hasQuotas = useGetHasInstanceQuota(options.previousInstance);

  return (instance: CatalogInstance): InstanceSelectorBadge[] => {
    const result = new Array<InstanceSelectorBadge>();

    if (instance.category === 'gpu') {
      result.push('new');
    }

    if (organization.plan !== 'hobby' && !hasQuotas(instance)) {
      result.push('requiresHigherQuota');
    }

    if (options.insufficientVRam) {
      result.push('insufficientVRam');
    }

    if (options.bestFit) {
      result.push('bestFit');
    }

    return result;
  };
}
