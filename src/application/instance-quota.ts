import { useCallback, useMemo } from 'react';

import { useOrganization, useOrganizationQuotas, useOrganizationSummary } from 'src/api/hooks/session';
import { CatalogInstance } from 'src/api/model';

export function useInstanceQuota(instance: CatalogInstance) {
  const getInstanceQuota = useGetInstanceQuota();

  return useMemo(() => getInstanceQuota(instance), [getInstanceQuota, instance]);
}

export function useGetInstanceQuota() {
  const organization = useOrganization();
  const quotas = useOrganizationQuotas();
  const summary = useOrganizationSummary();

  return useCallback(
    (instance: CatalogInstance) => {
      const max = () => {
        const { maxInstancesByType, instanceTypes } = quotas ?? {};
        const quota = maxInstancesByType?.[instance.identifier];

        if (quota !== undefined) {
          return quota;
        }

        if (instance.plans && !instance.plans.includes(organization.plan)) {
          return 0;
        }

        if (instanceTypes !== undefined && !instanceTypes.includes(instance.identifier)) {
          return 0;
        }

        return Infinity;
      };

      const used = () => {
        return summary?.instancesUsed[instance.identifier] ?? 0;
      };

      return { max: max(), used: used() };
    },
    [organization, quotas, summary],
  );
}
