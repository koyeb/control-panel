import sortBy from 'lodash-es/sortBy';
import { useMemo, useReducer } from 'react';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance, CatalogRegion, InstanceCategory, RegionCategory, ServiceType } from 'src/api/model';
import {
  useInstanceAvailabilities,
  useRegionAvailabilities,
} from 'src/application/instance-region-availability';
import { useSearchParam, useSearchParams } from 'src/hooks/router';
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

  const searchParams = useSearchParams();
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

  function ensureBusinessRules(state: InstanceRegionState, action?: InstanceRegionAction) {
    state.instances = instances.filter((instance) => {
      return instance.regionCategory === state.regionCategory && instance.category === state.instanceCategory;
    });

    if (state.selectedInstance) {
      if (!state.instances.includes(state.selectedInstance) || !isInstanceAvailable(state.selectedInstance)) {
        state.selectedInstance = null;
      }
    }

    if (state.selectedInstance === null) {
      const firstAvailableInstance = state.instances.find(isInstanceAvailable);

      if (firstAvailableInstance) {
        state.selectedInstance = firstAvailableInstance;
      }
    }

    state.regions = regions.filter((region) => {
      return region.category === state.regionCategory;
    });

    state.selectedRegions = state.selectedRegions.filter((region) => {
      return state.regions.includes(region) && isRegionAvailable(region, state.selectedInstance);
    });

    if (state.selectedRegions.length === 0 && action?.type !== 'region-selected') {
      const firstAvailableRegion = state.regions.find((region) =>
        isRegionAvailable(region, state.selectedInstance),
      );

      if (firstAvailableRegion !== undefined) {
        state.selectedRegions = [firstAvailableRegion];
      }
    }

    if (state.selectedInstance?.identifier === 'free' && state.selectedRegions.length >= 2) {
      state.selectedRegions = [defined(state.selectedRegions[0])];
    }

    state.regions = sortBy(state.regions, (region) =>
      isRegionAvailable(region, state.selectedInstance) ? -1 : 1,
    );

    return state;
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

    return ensureBusinessRules(next, action);
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

    const instanceParam = instances.find(hasProperty('identifier', searchParams.get('instance_type')));

    if (instanceParam) {
      state.instances = instances.filter(hasProperty('category', instanceParam.category));
      state.instanceCategory = instanceParam.category;
      state.selectedInstance = instanceParam;
    }

    return ensureBusinessRules(state);
  }

  return [reducer, getInitialState] as const;
}
