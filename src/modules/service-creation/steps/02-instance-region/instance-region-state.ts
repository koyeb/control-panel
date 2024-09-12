import { useMemo, useReducer } from 'react';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { InstanceCategory, RegionCategory, ServiceType } from 'src/api/model';
import {
  useInstanceAvailabilities,
  useRegionAvailabilities,
} from 'src/application/instance-region-availability';
import { useSearchParam } from 'src/hooks/router';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

type InstanceRegionState = {
  instance: string;
  instanceCategory: InstanceCategory;
  regionCategory: RegionCategory;
  regions: string[];
};

export function useInstanceRegionState() {
  const [reducer, getInitialState] = useStateReducer();
  const [state, dispatch] = useReducer(reducer, getInitialState());

  return [
    state,
    useMemo(
      () => ({
        instanceSelected: (instance: string) => {
          dispatch({ type: 'instance-selected', instance });
        },
        instanceCategorySelected: (category: InstanceCategory) => {
          dispatch({ type: 'instance-category-selected', category });
        },
        regionSelected: (region: string) => {
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
  instance: string;
};

type InstanceCategorySelected = {
  type: 'instance-category-selected';
  category: InstanceCategory;
};

type RegionSelected = {
  type: 'region-selected';
  region: string;
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

  function isRegionAvailable(regionIdentifier: string, instanceIdentifier: string) {
    const region = regions.find(hasProperty('identifier', regionIdentifier));

    if (!regionAvailabilities[regionIdentifier]?.[0]) {
      return false;
    }

    if (region?.instances !== undefined && !region.instances.includes(instanceIdentifier)) {
      return false;
    }

    return true;
  }

  function reducer(state: InstanceRegionState, action: InstanceRegionAction): InstanceRegionState {
    const next = { ...state };

    if (action.type === 'instance-selected') {
      next.instance = action.instance;
    }

    if (action.type === 'instance-category-selected') {
      const instancesInCategory = instances.filter(hasProperty('category', action.category));

      const firstAvailableInstancesInCategory = instancesInCategory.find((instance) => {
        return instanceAvailabilities[instance.identifier]?.[0];
      });

      const instance =
        firstAvailableInstancesInCategory?.identifier ?? instancesInCategory[0]?.identifier ?? next.instance;

      next.instance = instance;
      next.instanceCategory = action.category;
    }

    if (action.type === 'region-selected') {
      if (next.instance === 'free') {
        next.regions = [action.region];
      } else {
        const regions = [...next.regions];
        const index = regions.indexOf(action.region);

        if (index < 0) {
          regions.push(action.region);
        } else {
          regions.splice(index, 1);
        }

        next.regions = regions;
      }
    }

    if (action.type === 'region-category-selected') {
      const firstAvailableRegion = regions.find((region) => {
        return region.category === action.category && regionAvailabilities[region.identifier]?.[0];
      });

      next.regionCategory = action.category;
      next.regions = firstAvailableRegion ? [firstAvailableRegion.identifier] : [];
    }

    if (state.instance !== next.instance) {
      const selectedInstance = instances.find(hasProperty('identifier', next.instance));

      next.regions = next.regions.filter((region) => isRegionAvailable(region, next.instance));

      if (next.regions.length === 0) {
        const region = regions.find(hasProperty('identifier', selectedInstance?.regions?.[0] ?? 'fra'));

        assert(region !== undefined);

        next.regionCategory = region.category;
        next.regions = [region.identifier];
      }
    }

    return next;
  }

  function getInitialState() {
    const state: InstanceRegionState = {
      instance: 'nano',
      instanceCategory: 'standard',
      regionCategory: 'koyeb',
      regions: ['fra'],
    };

    if (organization.plan === 'hobby' && instanceAvailabilities['free']?.[0]) {
      state.instance = 'free';
      state.instanceCategory = 'eco';
    }

    return state;
  }

  return [reducer, getInitialState] as const;
}
