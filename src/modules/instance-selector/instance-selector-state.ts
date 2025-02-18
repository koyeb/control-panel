import { useCallback, useEffect, useRef, useState } from 'react';

import { CatalogInstance, CatalogRegion, InstanceCategory, RegionScope } from 'src/api/model';
import { InstanceAvailability, RegionAvailability } from 'src/application/instance-region-availability';
import { hasProperty } from 'src/utils/object';

export type InstanceSelectorParams = {
  instances: CatalogInstance[];
  regions: CatalogRegion[];
  instanceAvailabilities: Record<string, InstanceAvailability>;
  regionAvailabilities: Record<string, RegionAvailability>;
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
  instanceAvailabilities,
  regionAvailabilities,
  selectedInstance,
  setSelectedInstance,
  selectedRegions,
  setSelectedRegions,
}: InstanceSelectorParams): InstanceSelector {
  const [instanceCategory, setInstanceCategory] = useState<InstanceCategory>(
    selectedInstance?.category ?? 'standard',
  );

  const [regionScope, setRegionScope] = useState<RegionScope>(selectedRegions[0]?.scope ?? 'metropolitan');

  const isInstanceAvailable = useCallback(
    (instance: CatalogInstance) => instanceAvailabilities[instance.identifier]?.[0],
    [instanceAvailabilities],
  );

  const isRegionAvailable = useCallback(
    (region: CatalogRegion) => regionAvailabilities[region.identifier]?.[0],
    [regionAvailabilities],
  );

  const filterInstances = (category: InstanceCategory) => {
    return instances
      .filter((instance) => !instance.identifier.startsWith('aws-'))
      .filter(hasProperty('category', category))
      .filter(isInstanceAvailable);
  };

  const filterRegions = useCallback(
    (scope: RegionScope) => {
      return regions
        .filter((region) => !region.identifier.startsWith('aws-'))
        .filter(hasProperty('scope', scope))
        .filter(isRegionAvailable);
    },
    [regions, isRegionAvailable],
  );

  useEffect(() => {
    const instanceRegions = selectedInstance?.regions;

    if (instanceRegions) {
      const selectedAvailableRegions = selectedRegions.filter((region) =>
        instanceRegions.includes(region.identifier),
      );

      if (selectedAvailableRegions.length !== selectedRegions.length) {
        setSelectedRegions(selectedAvailableRegions);
      }
    }
  }, [selectedInstance, selectedRegions, setSelectedRegions]);

  // allow unselecting all regions
  const preventSelectRegion = useRef(false);

  useEffect(() => {
    if (selectedRegions.length > 0 || preventSelectRegion.current) {
      return;
    }

    const availableRegions = filterRegions(regionScope);

    if (availableRegions.length > 0) {
      setSelectedRegions([availableRegions[0]!]);
    } else {
      const availableRegions = filterRegions(otherScope(regionScope));

      if (availableRegions.length > 0) {
        setRegionScope(otherScope(regionScope));
        setSelectedRegions([availableRegions[0]!]);
      }
    }
  }, [filterRegions, regionScope, selectedRegions, isRegionAvailable, setSelectedRegions]);

  return {
    instanceCategory,
    onInstanceCategorySelected: (category) => {
      setInstanceCategory(category);
      setSelectedInstance(filterInstances(category)[0] ?? null);
    },

    get regionScope() {
      if (filterRegions(otherScope(regionScope)).length === 0) {
        return null;
      }

      return regionScope;
    },
    onRegionScopeSelected: (scope) => {
      setRegionScope(scope);

      const firstAvailableRegion = filterRegions(scope)[0];

      setSelectedRegions(firstAvailableRegion ? [firstAvailableRegion] : []);
    },

    selectedInstance,
    onInstanceSelected: (instance) => {
      setSelectedInstance(instance);
    },

    selectedRegions,
    onRegionSelected: (region) => {
      const index = selectedRegions.indexOf(region);

      preventSelectRegion.current = true;

      if (index === -1) {
        setSelectedRegions([...selectedRegions, region]);
      } else {
        setSelectedRegions(selectedRegions.filter((r) => r !== region));
      }

      setTimeout(() => {
        preventSelectRegion.current = false;
      }, 0);
    },

    instances: filterInstances(instanceCategory),
    regions: filterRegions(regionScope),
  };
}

function otherScope(scope: RegionScope): RegionScope {
  const map: Record<RegionScope, RegionScope> = {
    continental: 'metropolitan',
    metropolitan: 'continental',
  };

  return map[scope];
}
