import { dequal } from 'dequal';
import { useState } from 'react';

import { CatalogInstance, CatalogRegion, InstanceCategory, RegionScope } from 'src/api/model';
import { InstanceAvailability } from 'src/application/instance-region-availability';
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
  const [instanceCategory, setInstanceCategory] = useState<InstanceCategory>(
    selectedInstance?.category ?? 'standard',
  );

  const [regionScope, setRegionScope] = useState<RegionScope>(selectedRegions[0]?.scope ?? 'metropolitan');

  return instanceSelector(
    { availabilities, instances, regions, singleRegion },
    { instanceCategory, regionScope, selectedInstance, selectedRegions },
    (next) => {
      if (instanceCategory !== next.instanceCategory) setInstanceCategory(next.instanceCategory);
      if (regionScope !== next.regionScope) setRegionScope(next.regionScope);
      if (selectedInstance !== next.selectedInstance) setSelectedInstance(next.selectedInstance);
      if (!dequal(selectedRegions, next.selectedRegions)) setSelectedRegions(next.selectedRegions);
    },
  );
}

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
  state: InstanceSelectorState,
  setState: (state: InstanceSelectorState) => void,
): InstanceSelector {
  const isInstanceAvailable = (instance: CatalogInstance) => {
    return availabilities[instance.identifier]?.[0];
  };

  const isRegionAvailableForInstance = (region: CatalogRegion, instance: CatalogInstance | null) => {
    return !instance?.regions || instance.regions.includes(region.identifier);
  };

  const filterInstances = (category: InstanceCategory) => {
    return instances
      .filter((instance) => !instance.identifier.startsWith('aws-'))
      .filter(hasProperty('category', category))
      .filter(isInstanceAvailable);
  };

  const filterRegions = (scope: RegionScope, instance: CatalogInstance | null) => {
    return regions
      .filter((region) => !region.identifier.startsWith('aws-'))
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

    const filteredRegions = filterRegions(nextState.regionScope, nextState.selectedInstance);

    nextState.selectedRegions = nextState.selectedRegions.filter((region) =>
      filteredRegions.includes(region),
    );

    if (nextState.selectedRegions.length === 0 && updates.selectedRegions === undefined) {
      const firstAvailableRegion = filteredRegions[0];

      if (firstAvailableRegion) {
        nextState.selectedRegions = [firstAvailableRegion];
      } else {
        const firstAvailableRegion = filterRegions(
          otherScope(nextState.regionScope),
          nextState.selectedInstance,
        )[0];

        if (firstAvailableRegion) {
          nextState.regionScope = otherScope(nextState.regionScope);
          nextState.selectedRegions = [firstAvailableRegion];
        }
      }
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
      if (selectedInstance?.identifier === 'free' || singleRegion) {
        update({ selectedRegions: [region] });
        return;
      }

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
