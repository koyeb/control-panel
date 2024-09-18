import sortBy from 'lodash-es/sortBy';
import { useMemo, useReducer } from 'react';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance, CatalogRegion, InstanceCategory, RegionCategory, ServiceType } from 'src/api/model';
import {
  useInstanceAvailabilities,
  useRegionAvailabilities,
} from 'src/application/instance-region-availability';
import { useSearchParam } from 'src/hooks/router';
import { defined } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

type InstanceRegionState = {
  instances: CatalogInstance[];
  regions: CatalogRegion[];
  selectedInstance: CatalogInstance | null;
  instanceCategory: InstanceCategory;
  regionCategory: RegionCategory;
  selectedRegions: CatalogRegion[];
};

export function useInstanceRegionState() {
  const [reducer, getInitialState] = useStateReducer();
  const [state, dispatch] = useReducer(reducer, getInitialState());

  return [
    state,
    useMemo(
      () => ({
        instanceSelected: (instance: CatalogInstance) => {
          dispatch({ type: 'instance-selected', instance });
        },
        instanceCategorySelected: (category: InstanceCategory) => {
          dispatch({ type: 'instance-category-selected', category });
        },
        regionSelected: (region: CatalogRegion) => {
          dispatch({ type: 'region-selected', region });
        },
        regionCategorySelected: (category: RegionCategory) => {
          dispatch({ type: 'region-category-selected', category });
        },
      }),
      [dispatch],
    ),
  ] as const;
}

type InstanceSelected = {
  type: 'instance-selected';
  instance: CatalogInstance;
};

type InstanceCategorySelected = {
  type: 'instance-category-selected';
  category: InstanceCategory;
};

type RegionSelected = {
  type: 'region-selected';
  region: CatalogRegion;
};

type RegionCategorySelected = {
  type: 'region-category-selected';
  category: RegionCategory;
};

type InstanceRegionAction =
  | InstanceSelected
  | InstanceCategorySelected
  | RegionSelected
  | RegionCategorySelected;

function useStateReducer() {
  const organization = useOrganization();
  const instances = useInstances();
  const regions = useRegions();

  const [serviceType] = useSearchParam('service_type') as [ServiceType, unknown];
  const instanceAvailabilities = useInstanceAvailabilities({ serviceType });
  const regionAvailabilities = useRegionAvailabilities();

  function isInstanceAvailable(instance: CatalogInstance) {
    return Boolean(instanceAvailabilities[instance.identifier]?.[0]);
  }

  function isRegionAvailable(region: CatalogRegion, instance: CatalogInstance | null) {
    if (!regionAvailabilities[region.identifier]?.[0]) {
      return false;
    }

    if (
      instance !== null &&
      region?.instances !== undefined &&
      !region.instances.includes(instance.identifier)
    ) {
      return false;
    }

    return true;
  }

  function reducer(state: InstanceRegionState, action: InstanceRegionAction): InstanceRegionState {
    const next = { ...state };

    if (action.type === 'region-category-selected') {
      next.regionCategory = action.category;

      if (action.category === 'aws') {
        next.instanceCategory = 'standard';
      }
    }

    if (action.type === 'instance-selected') {
      next.selectedInstance = action.instance;
    }

    if (action.type === 'instance-category-selected') {
      next.instanceCategory = action.category;
    }

    if (action.type === 'region-selected') {
      if (next.selectedInstance?.identifier === 'free') {
        next.selectedRegions = [action.region];
      } else {
        const regions = [...next.selectedRegions];
        const index = regions.indexOf(action.region);

        if (index < 0) {
          regions.push(action.region);
        } else {
          regions.splice(index, 1);
        }

        next.selectedRegions = regions;
      }
    }

    next.instances = instances.filter((instance) => {
      return instance.regionCategory === next.regionCategory && instance.category === next.instanceCategory;
    });

    if (next.selectedInstance) {
      if (!next.instances.includes(next.selectedInstance) || !isInstanceAvailable(next.selectedInstance)) {
        next.selectedInstance = null;
      }
    }

    if (next.selectedInstance === null) {
      const firstAvailableInstance = next.instances.find(isInstanceAvailable);

      if (firstAvailableInstance) {
        next.selectedInstance = firstAvailableInstance;
      }
    }

    next.regions = regions.filter((region) => {
      return region.category === next.regionCategory;
    });

    next.selectedRegions = next.selectedRegions.filter((region) => {
      return next.regions.includes(region) && isRegionAvailable(region, next.selectedInstance);
    });

    if (next.selectedRegions.length === 0 && action.type !== 'region-selected') {
      const firstAvailableRegion = next.regions.find((region) =>
        isRegionAvailable(region, next.selectedInstance),
      );

      if (firstAvailableRegion !== undefined) {
        next.selectedRegions = [firstAvailableRegion];
      }
    }

    if (next.selectedInstance?.identifier === 'free' && next.selectedRegions.length >= 2) {
      next.selectedRegions = [defined(next.selectedRegions[0])];
    }

    next.regions = sortBy(next.regions, (region) =>
      isRegionAvailable(region, next.selectedInstance) ? -1 : 1,
    );

    return next;
  }

  function getInitialState() {
    const free = defined(instances.find(hasProperty('identifier', 'free')));
    const nano = defined(instances.find(hasProperty('identifier', 'nano')));
    const fra = defined(regions.find(hasProperty('identifier', 'fra')));

    const state: InstanceRegionState = {
      instances: instances
        .filter(hasProperty('regionCategory', 'koyeb'))
        .filter(hasProperty('category', 'standard')),
      regions: regions.filter(hasProperty('category', 'koyeb')),
      selectedInstance: nano,
      instanceCategory: 'standard',
      regionCategory: 'koyeb',
      selectedRegions: [fra],
    };

    if (organization.plan === 'hobby' && isInstanceAvailable(free)) {
      state.instances = instances.filter(hasProperty('category', 'eco'));
      state.selectedInstance = free;
      state.instanceCategory = 'eco';
    }

    return state;
  }

  return [reducer, getInitialState] as const;
}
