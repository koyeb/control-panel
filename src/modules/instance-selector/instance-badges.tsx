import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance } from 'src/api/model';
import { useGetHasInstanceQuota } from 'src/application/instance-quota';
import { isTenstorrentGpu } from 'src/application/tenstorrent';

import { InstanceSelectorBadge } from './instance-selector';

type UseGetInstanceBadgesOptions = {
  previousInstance?: CatalogInstance;
  bestFit?: CatalogInstance;
  insufficientVRam?: (instance: CatalogInstance) => boolean;
};

export function useGetInstanceBadges(options: UseGetInstanceBadgesOptions = {}) {
  const organization = useOrganization();
  const hasQuotas = useGetHasInstanceQuota(options.previousInstance);

  return (instance: CatalogInstance): InstanceSelectorBadge[] => {
    const result = new Array<InstanceSelectorBadge>();

    if (instance.category === 'gpu') {
      result.push('new');
    }

    if (organization.plan !== 'hobby' && !hasQuotas(instance)) {
      if (isTenstorrentGpu(instance)) {
        result.push('preview');
      } else {
        result.push('requiresHigherQuota');
      }
    }

    if (options.insufficientVRam?.(instance)) {
      result.push('insufficientVRam');
    }

    if (instance === options.bestFit) {
      result.push('bestFit');
    }

    return result;
  };
}
