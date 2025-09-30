import { useGetHasInstanceQuota } from 'src/application/instance-quota';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { CatalogInstance } from 'src/model';

import { InstanceSelectorBadge } from './instance-selector';

type UseGetInstanceBadgesOptions = {
  previousInstance?: CatalogInstance;
  bestFit?: CatalogInstance;
  insufficientVRam?: (instance: CatalogInstance) => boolean;
};

export function useGetInstanceBadges(options: UseGetInstanceBadgesOptions = {}) {
  const hasQuotas = useGetHasInstanceQuota(options.previousInstance);

  return (instance: CatalogInstance): InstanceSelectorBadge[] => {
    const result = new Array<InstanceSelectorBadge>();

    if (instance.category === 'gpu') {
      result.push('new');
    }

    if (!hasQuotas(instance)) {
      result.push('requiresHigherQuota');
    }

    if (isTenstorrentGpu(instance)) {
      result.push('preview');
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
