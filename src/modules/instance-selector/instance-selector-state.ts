import { useQueryClient } from '@tanstack/react-query';
import { dequal } from 'dequal';
import { useState } from 'react';

import { useDatacenters } from 'src/api/hooks/catalog';
import { CatalogInstance, CatalogRegion, InstanceCategory, Organization, RegionScope } from 'src/api/model';
import { getDefaultRegion } from 'src/application/default-region';
import { InstanceAvailability } from 'src/application/instance-region-availability';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { last } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

export type InstanceSelectorParams = {
  instances: readonly CatalogInstance[];
  regions: readonly CatalogRegion[];
  singleRegion?: boolean;
  availabilities: Record<string, InstanceAvailability>;
  selectedInstance: CatalogInstance | null;
  setSelectedInstance: (instance: CatalogInstance | null) => void;
  selectedRegions: CatalogRegion[];
  setSelectedRegions: (regions: CatalogRegion[]) => void;
};

export type InstanceSelector = {
  instanceCategory: InstanceCategory;
  onInstanceCategorySelected: (category: InstanceCategory) => void;

  regionScope: RegionScope | null;
  onRegionScopeSelected: (scope: RegionScope) => void;

  selectedInstance: CatalogInstance | null;
  onInstanceSelected: (instance: CatalogInstance) => void;

  selectedRegions: CatalogRegion[];
  onRegionSelected: (region: CatalogRegion) => void;

  instances: CatalogInstance[];
  regions: CatalogRegion[];
};

export function useInstanceSelector({
  instances,
  regions,
  singleRegion,
  availabilities,
  selectedInstance,
  setSelectedInstance,
  selectedRegions,
  setSelectedRegions,
}: InstanceSelectorParams): InstanceSelector {
  const queryClient = useQueryClient();
  const datacenters = useDatacenters();

  const [instanceCategory, setInstanceCategory] = useState<InstanceCategory>(
    selectedInstance?.category ?? 'standard',
  );

  const [regionScope, setRegionScope] = useState<RegionScope>(selectedRegions[0]?.scope ?? 'metropolitan');

  return instanceSelector(
    { availabilities, instances, regions, singleRegion },
    (regions, instance) => getDefaultRegion(queryClient, datacenters, regions, instance),
    { instanceCategory, regionScope, selectedInstance, selectedRegions },
    (next) => {
      if (instanceCategory !== next.instanceCategory) setInstanceCategory(next.instanceCategory);
      if (regionScope !== next.regionScope) setRegionScope(next.regionScope);
      if (selectedInstance !== next.selectedInstance) setSelectedInstance(next.selectedInstance);
      if (!dequal(selectedRegions, next.selectedRegions)) setSelectedRegions(next.selectedRegions);
    },
  );
}

type GetDefaultRegion = (
  regions: CatalogRegion[],
  instance: CatalogInstance | undefined,
) => CatalogRegion | undefined;

export type InstanceSelectorState = {
  instanceCategory: InstanceCategory;
  regionScope: RegionScope;
  selectedInstance: CatalogInstance | null;
  selectedRegions: CatalogRegion[];
};

export function instanceSelector(
  {
    availabilities,
    instances,
    regions,
    singleRegion,
  }: Pick<InstanceSelectorParams, 'availabilities' | 'instances' | 'regions' | 'singleRegion'>,
  getDefaultRegion: GetDefaultRegion,
  state: InstanceSelectorState,
  setState: (state: InstanceSelectorState) => void,
): InstanceSelector {
  const isInstanceAvailable = (instance: CatalogInstance) => {
    return availabilities[instance.id]?.[0];
  };

  const isRegionAvailableForInstance = (region: CatalogRegion, instance: CatalogInstance | null) => {
    return !instance?.regions || instance.regions.includes(region.id);
  };

  const filterInstances = (category: InstanceCategory) => {
    return instances
      .filter((instance) => !instance.id.startsWith('aws-'))
      .filter(hasProperty('category', category))
      .filter(isInstanceAvailable);
  };

  const filterRegions = (scope: RegionScope, instance: CatalogInstance | null) => {
    return regions
      .filter((region) => !region.id.startsWith('aws-'))
      .filter(hasProperty('scope', scope))
      .filter(hasProperty('status', 'available'))
      .filter((region) => isRegionAvailableForInstance(region, instance));
  };

  const update = (updates: Partial<InstanceSelectorState>) => {
    const nextState = { ...state, ...updates };

    const filteredInstances = filterInstances(nextState.instanceCategory);

    if (nextState.selectedInstance && !filteredInstances.includes(nextState.selectedInstance)) {
      nextState.selectedInstance = null;
    }

    if (nextState.selectedInstance === null) {
      const firstAvailableInstance = filteredInstances.find(isInstanceAvailable);

      if (firstAvailableInstance) {
        nextState.selectedInstance = firstAvailableInstance;
      }
    }

    if (updates.instanceCategory === 'gpu') {
      nextState.regionScope = 'continental';
    }

    const filteredRegions = filterRegions(nextState.regionScope, nextState.selectedInstance);

    nextState.selectedRegions = nextState.selectedRegions.filter((region) =>
      filteredRegions.includes(region),
    );

    if (
      updates.selectedInstance !== undefined ||
      (nextState.selectedRegions.length === 0 && !updates.selectedRegions)
    ) {
      const selectDefaultRegion = (scope: RegionScope) => {
        const regions = filterRegions(scope, nextState.selectedInstance);
        let defaultRegion = getDefaultRegion(regions, nextState.selectedInstance ?? undefined);

        if (!defaultRegion) {
          defaultRegion = regions[0];
        }

        if (defaultRegion) {
          nextState.selectedRegions = [defaultRegion];
          nextState.regionScope = scope;
        }
      };

      selectDefaultRegion(nextState.regionScope);

      if (nextState.selectedRegions.length === 0) {
        selectDefaultRegion(otherScope(nextState.regionScope));
      }
    }

    const isFreeInstance = nextState.selectedInstance?.id === 'free';

    if ((singleRegion || isFreeInstance) && nextState.selectedRegions.length >= 2) {
      nextState.selectedRegions = [last(nextState.selectedRegions)!];
    }

    setState(nextState);
  };

  const { instanceCategory, regionScope, selectedInstance, selectedRegions } = state;

  return {
    instanceCategory,
    onInstanceCategorySelected: (instanceCategory) => {
      update({ instanceCategory });
    },

    get regionScope() {
      if (filterRegions(otherScope(regionScope), selectedInstance).length === 0) {
        return null;
      }

      return regionScope;
    },
    onRegionScopeSelected: (regionScope) => {
      update({ regionScope });
    },

    selectedInstance,
    onInstanceSelected: (selectedInstance) => {
      update({ selectedInstance });
    },

    selectedRegions,
    onRegionSelected: (region) => {
      const regions = selectedRegions.slice();
      const index = regions.indexOf(region);

      if (index === -1) {
        regions.push(region);
      } else {
        regions.splice(index, 1);
      }

      update({ selectedRegions: regions });
    },

    instances: filterInstances(instanceCategory),
    regions: filterRegions(regionScope, selectedInstance),
  };
}

function otherScope(scope: RegionScope): RegionScope {
  const map: Record<RegionScope, RegionScope> = {
    continental: 'metropolitan',
    metropolitan: 'continental',
  };

  return map[scope];
}

export function shouldAddCreditCard(
  organization: Organization,
  instance: CatalogInstance,
  quota: { max: number },
) {
  const isHobby = organization.plan === 'hobby';
  const isTrial = organization.trial !== undefined;

  if (isHobby) {
    return true;
  }

  if (isTrial && isTenstorrentGpu(instance) && quota.max === 0) {
    return true;
  }

  return false;
}
