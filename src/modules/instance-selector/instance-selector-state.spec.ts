import { beforeEach, describe, expect, it } from 'vitest';

import { CatalogInstance, CatalogRegion, InstanceCategory, RegionScope } from 'src/api/model';
import { InstanceAvailability } from 'src/application/instance-region-availability';
import { create } from 'src/utils/factories';

import { InstanceSelector, instanceSelector, InstanceSelectorState } from './instance-selector-state';

describe('instance selector', () => {
  let free: CatalogInstance, ecoNano: CatalogInstance, ecoMicro: CatalogInstance;
  let nano: CatalogInstance, micro: CatalogInstance, awsNano: CatalogInstance;
  let gpu1: CatalogInstance, gpu2: CatalogInstance;

  let fra: CatalogRegion, par: CatalogRegion, eu: CatalogRegion;

  let availabilities: Record<string, InstanceAvailability>;

  let state: InstanceSelectorState;
  let selector: InstanceSelector;

  beforeEach(() => {
    free = create.instance({ identifier: 'free', category: 'eco' });
    ecoNano = create.instance({ identifier: 'eco-nano', category: 'eco' });
    ecoMicro = create.instance({ identifier: 'eco-micro', category: 'eco' });

    nano = create.instance({ identifier: 'nano', category: 'standard' });
    micro = create.instance({ identifier: 'micro', category: 'standard' });
    awsNano = create.instance({ identifier: 'aws-nano', category: 'standard' });

    gpu1 = create.instance({ identifier: 'gpu-1', category: 'gpu' });
    gpu2 = create.instance({ identifier: 'gpu-2', category: 'gpu' });

    fra = create.region({ identifier: 'fra', scope: 'metropolitan' });
    par = create.region({ identifier: 'par', scope: 'metropolitan' });
    eu = create.region({ identifier: 'eu', scope: 'continental' });

    availabilities = {
      [free.identifier]: [true],
      [ecoNano.identifier]: [true],
      [ecoMicro.identifier]: [true],
      [nano.identifier]: [true],
      [micro.identifier]: [true],
      [awsNano.identifier]: [true],
      [gpu1.identifier]: [true],
      [gpu2.identifier]: [true],
    };

    state = {
      regionScope: 'metropolitan',
      instanceCategory: 'standard',
      selectedInstance: null,
      selectedRegions: [],
    };
  });

  const setInitialInstance = (instance: CatalogInstance) => {
    state.instanceCategory = instance.category;
    state.selectedInstance = instance;
  };

  const setInitialRegions = (regions: CatalogRegion[]) => {
    state.regionScope = regions[0]!.scope;
    state.selectedRegions = regions;
  };

  const setup = (cb?: () => void) => {
    act(cb);
  };

  const act = (cb?: () => void) => {
    cb?.();

    selector = instanceSelector(
      {
        instances: [free, ecoNano, ecoMicro, nano, micro, awsNano, gpu1, gpu2],
        regions: [fra, par, eu],
        availabilities,
      },
      state,
      (next) => (state = next),
    );
  };

  it('initializes the instance selector', () => {
    setup();

    expect(selector.instanceCategory).toEqual<InstanceCategory>('standard');
    expect(selector.regionScope).toEqual<RegionScope>('metropolitan');
    expect(selector.selectedInstance).toBeNull();
    expect(selector.selectedRegions).toHaveLength(0);
    expect(selector.instances).toHaveLength(2);
    expect(selector.regions).toHaveLength(2);
  });

  it('initializes with a selected instance and regions', () => {
    setup(() => {
      setInitialInstance(free);
      setInitialRegions([fra]);
    });

    expect(selector.instanceCategory).toEqual<InstanceCategory>('eco');
    expect(selector.selectedInstance).toBe(free);
    expect(selector.selectedRegions).toEqual([fra]);
  });

  describe('instances list', () => {
    it('filters the instances list by instance category', () => {
      setup(() => {
        setInitialInstance(free);
      });

      expect(selector.instances).toEqual([free, ecoNano, ecoMicro]);
    });

    it('filters out unavailable instances', () => {
      setup(() => {
        availabilities[ecoMicro.identifier] = [false, 'unavailableInCatalog'];
        setInitialInstance(free);
      });

      expect(selector.instances).toEqual([free, ecoNano]);
    });
  });

  describe('regions list', () => {
    it('filters regions by selected region scope', () => {
      setup(() => {
        setInitialRegions([fra]);
      });

      expect(selector.regions).toEqual([fra, par]);
    });

    it('filters out unavailable regions', () => {
      setup(() => {
        setInitialInstance(nano);
        setInitialRegions([fra]);
        nano.regions = ['fra'];
      });

      expect(selector.regions).toEqual([fra]);
    });

    it('allows only one region to be selected with the free instance', () => {
      setup(() => {
        setInitialInstance(free);
        setInitialRegions([fra]);
      });

      act(() => selector.onRegionSelected(par));

      expect(selector.selectedRegions).toEqual([par]);
    });
  });

  describe('instance category selection', () => {
    it('changes the selected instance category', () => {
      setup();

      act(() => selector.onInstanceCategorySelected('eco'));

      expect(selector.instanceCategory).toEqual<InstanceCategory>('eco');
      expect(selector.instances).toEqual([free, ecoNano, ecoMicro]);
    });

    it('selects the first instance when the category changes', () => {
      setup();

      act(() => selector.onInstanceCategorySelected('eco'));

      expect(selector.selectedInstance).toBe(free);
    });

    it('selects the first available instance', () => {
      setup(() => {
        availabilities[free.identifier] = [false, 'freeAlreadyUsed'];
      });

      act(() => selector.onInstanceCategorySelected('eco'));

      expect(selector.selectedInstance).toBe(ecoNano);
    });
  });

  describe('instance selection', () => {
    it('selects an instance', () => {
      setup();

      act(() => selector.onInstanceSelected(nano));

      expect(selector.selectedInstance).toBe(nano);
    });

    it('unselects regions that became unavailable when selecting the instance', () => {
      setup(() => {
        micro.regions = ['fra'];
        setInitialRegions([fra, par]);
      });

      act(() => selector.onInstanceSelected(micro));

      expect(selector.selectedRegions).toEqual([fra]);
    });

    it('selects the first available region when all previously selected regions became unavailable', () => {
      setup(() => {
        micro.regions = ['fra'];
        setInitialRegions([par]);
      });

      act(() => selector.onInstanceSelected(micro));

      expect(selector.selectedRegions).toEqual([fra]);
    });
  });

  describe('region scope', () => {
    it('does not return a scope when there is no available region in the other scope', () => {
      setup(() => {
        eu.status = 'coming_soon';
      });

      expect(selector.regionScope).toBeNull();
    });

    it('selects a region scope', () => {
      setup();

      act(() => selector.onRegionScopeSelected('continental'));

      expect(selector.regionScope).toEqual<RegionScope>('continental');
    });

    it('selects the first available region in the selected scope', () => {
      setup();

      act(() => selector.onRegionScopeSelected('continental'));

      expect(selector.selectedRegions).toEqual([eu]);
    });

    it('changes the scope when no instance is available in the current one but some are in the other', () => {
      setup(() => {
        micro.regions = ['par'];
        setInitialInstance(nano);
        setInitialRegions([eu]);
      });

      act(() => selector.onInstanceSelected(micro));

      expect(selector.regionScope).toEqual(null);
      expect(selector.selectedRegions).toEqual([par]);
    });
  });

  describe('region selection', () => {
    it('adds a region to the selection', () => {
      setup(() => {
        setInitialRegions([fra]);
      });

      act(() => selector.onRegionSelected(par));

      expect(selector.selectedRegions).toEqual([fra, par]);
    });

    it('removes a region from the selection', () => {
      setup(() => {
        setInitialRegions([fra, par]);
      });

      act(() => selector.onRegionSelected(par));

      expect(selector.selectedRegions).toEqual([fra]);
    });

    it('allows unselecting all regions', () => {
      setup(() => {
        setInitialRegions([fra]);
      });

      act(() => selector.onRegionSelected(fra));

      expect(selector.selectedRegions).toEqual([]);
    });
  });
});
