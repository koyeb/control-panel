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

  function update(
    values: Partial<{
      instanceCategory: InstanceCategory;
      regionScope: RegionScope;
      selectedInstance: CatalogInstance;
      selectedRegions: CatalogRegion[];
    }>,
  ) {
    const state = { instanceCategory, regionScope, selectedInstance, selectedRegions, ...values };

    const filteredInstances = filterInstances(state.instanceCategory);

    if (state.selectedInstance && !filteredInstances.includes(state.selectedInstance)) {
      state.selectedInstance = null;
    }

    if (state.selectedInstance === null) {
      const firstAvailableInstance = filteredInstances.find(isInstanceAvailable);

      if (firstAvailableInstance) {
        state.selectedInstance = firstAvailableInstance;
      }
    }

    const filteredRegions = filterRegions(state.regionScope, state.selectedInstance);

    state.selectedRegions = state.selectedRegions.filter((region) => filteredRegions.includes(region));

    if (state.selectedRegions.length === 0 && values.selectedRegions === undefined) {
      const firstAvailableRegion = filteredRegions[0];

      if (firstAvailableRegion) {
        state.selectedRegions = [firstAvailableRegion];
      } else {
        const firstAvailableRegion = filterRegions(otherScope(state.regionScope), state.selectedInstance)[0];

        if (firstAvailableRegion) {
          state.regionScope = otherScope(state.regionScope);
          state.selectedRegions = [firstAvailableRegion];
        }
      }
    }

    if (instanceCategory !== state.instanceCategory) setInstanceCategory(state.instanceCategory);
    if (regionScope !== state.regionScope) setRegionScope(state.regionScope);
    if (selectedInstance !== state.selectedInstance) setSelectedInstance(state.selectedInstance);
    if (!dequal(selectedRegions, state.selectedRegions)) setSelectedRegions(state.selectedRegions);
  }

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
