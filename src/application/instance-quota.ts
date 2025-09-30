import { useCallback, useMemo } from 'react';

import { useOrganizationQuotas, useOrganizationSummary } from 'src/api';
import { CatalogInstance } from 'src/model';

export function useInstanceQuota(instance: CatalogInstance) {
  const getInstanceQuota = useGetInstanceQuota();

  return useMemo(() => getInstanceQuota(instance), [getInstanceQuota, instance]);
}

export function useHasInstanceQuota(instance: CatalogInstance, previousInstance?: CatalogInstance) {
  const hasQuota = useGetHasInstanceQuota(previousInstance);

  return useMemo(() => hasQuota(instance), [instance, hasQuota]);
}

export function useGetHasInstanceQuota(previousInstance?: CatalogInstance) {
  const getQuota = useGetInstanceQuota();

  return useCallback(
    (instance: CatalogInstance) => {
      const quota = getQuota(instance);

      // allow keeping the same instance
      if (previousInstance?.id === instance.id) {
        return true;
      }

      return quota.used < quota.max;
    },
    [getQuota, previousInstance],
  );
}

export function useGetInstanceQuota() {
  const quotas = useOrganizationQuotas();
  const summary = useOrganizationSummary();

  return useCallback(
    (instance: CatalogInstance) => {
      const max = () => {
        const { maxInstancesByType, instanceTypes } = quotas;
        const quota = maxInstancesByType[instance.id];

        if (quota !== undefined) {
          return quota;
        }

        if (instanceTypes !== undefined && !instanceTypes.includes(instance.id)) {
          return 0;
        }

        return Infinity;
      };

      const used = () => {
        return summary.instancesUsed[instance.id] ?? 0;
      };

      return { max: max(), used: used() };
    },
    [quotas, summary],
  );
}
