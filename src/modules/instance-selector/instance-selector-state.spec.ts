import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { CatalogInstance, CatalogRegion, InstanceCategory, RegionScope } from 'src/api/model';
import { InstanceAvailability, RegionAvailability } from 'src/application/instance-region-availability';
import { create } from 'src/utils/factories';

import { useInstanceSelector } from './instance-selector-state';

describe('instance selector', () => {
  let free: CatalogInstance, ecoNano: CatalogInstance, ecoMicro: CatalogInstance;
  let nano: CatalogInstance, micro: CatalogInstance, awsNano: CatalogInstance;
  let gpu1: CatalogInstance, gpu2: CatalogInstance;

  let fra: CatalogRegion, par: CatalogRegion, eu: CatalogRegion;

  let instanceAvailabilities: Record<string, InstanceAvailability>;
  let regionAvailabilities: Record<string, RegionAvailability>;

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

    instanceAvailabilities = {
      [free.identifier]: [true],
      [ecoNano.identifier]: [true],
      [ecoMicro.identifier]: [true],
      [nano.identifier]: [true],
      [micro.identifier]: [true],
      [awsNano.identifier]: [true],
      [gpu1.identifier]: [true],
      [gpu2.identifier]: [true],
    };

    regionAvailabilities = {
      [fra.identifier]: [true],
      [par.identifier]: [true],
      [eu.identifier]: [true],
    };
  });

  function useTest({
    initialInstance = null,
    initialRegions = [],
  }: { initialInstance?: CatalogInstance | null; initialRegions?: CatalogRegion[] } = {}) {
    const [selectedInstance, setSelectedInstance] = useState<CatalogInstance | null>(initialInstance);
    const [selectedRegions, setSelectedRegions] = useState<CatalogRegion[]>(initialRegions);

    return {
      setSelectedInstance,
      setSelectedRegions,
      ...useInstanceSelector({
        instances: [free, ecoNano, ecoMicro, nano, micro, awsNano, gpu1, gpu2],
        regions: [fra, par, eu],
        instanceAvailabilities,
        regionAvailabilities,
        selectedInstance,
        setSelectedInstance,
        selectedRegions,
        setSelectedRegions,
      }),
    };
  }

  it('initializes the instance selector', () => {
    const { result } = renderHook(() => useTest({ initialInstance: null }));

    expect(result.current.instanceCategory).toEqual<InstanceCategory>('standard');
    expect(result.current.regionScope).toEqual<RegionScope>('metropolitan');
    expect(result.current.selectedInstance).toBeNull();
    expect(result.current.selectedRegions).toHaveLength(1);
    expect(result.current.instances).toHaveLength(2);
    expect(result.current.regions).toHaveLength(2);
  });

  it('initializes with a selected instance and regions', () => {
    const { result } = renderHook(() => useTest({ initialInstance: free, initialRegions: [fra] }));

    expect(result.current.instanceCategory).toEqual<InstanceCategory>('eco');
    expect(result.current.selectedInstance).toBe(free);
    expect(result.current.selectedRegions).toEqual([fra]);
  });

  describe('instances list', () => {
    it('filters the instances list by instance category', () => {
      const { result } = renderHook(() => useTest({ initialInstance: free }));

      expect(result.current.instances).toEqual([free, ecoNano, ecoMicro]);
    });

    it('filters out unavailable instances', () => {
      instanceAvailabilities[ecoMicro.identifier] = [false, 'unavailableInCatalog'];

      const { result } = renderHook(() => useTest({ initialInstance: free }));

      expect(result.current.instances).toEqual([free, ecoNano]);
    });
  });

  describe('regions list', () => {
    it('filters regions by selected region scope', () => {
      const { result } = renderHook(() => useTest({ initialRegions: [fra] }));

      expect(result.current.regions).toEqual([fra, par]);
    });

    it('filters out unavailable regions', () => {
      regionAvailabilities[par.identifier] = [false, 'unavailable'];

      const { result } = renderHook(() => useTest({ initialRegions: [fra] }));

      expect(result.current.regions).toEqual([fra]);
    });
  });

  describe('instance category selection', () => {
    it('changes the selected instance category', () => {
      const { result } = renderHook(() => useTest());

      act(() => result.current.onInstanceCategorySelected('eco'));

      expect(result.current.instanceCategory).toEqual<InstanceCategory>('eco');
      expect(result.current.instances).toEqual([free, ecoNano, ecoMicro]);
    });

    it('selects the first instance when the category changes', () => {
      const { result } = renderHook(() => useTest());

      act(() => result.current.onInstanceCategorySelected('eco'));

      expect(result.current.selectedInstance).toBe(free);
    });

    it('selects the first available instance', () => {
      instanceAvailabilities[free.identifier] = [false, 'freeAlreadyUsed'];

      const { result } = renderHook(() => useTest());

      act(() => result.current.onInstanceCategorySelected('eco'));

      expect(result.current.selectedInstance).toBe(ecoNano);
    });
  });

  describe('instance selection', () => {
    it('selects an instance', () => {
      const { result } = renderHook(() => useTest());

      act(() => result.current.onInstanceSelected(nano));

      expect(result.current.selectedInstance).toBe(nano);
    });

    it('unselects regions that became unavailable when selecting the instance', () => {
      micro.regions = ['fra'];

      const { result } = renderHook(() => useTest({ initialRegions: [fra, par] }));

      act(() => result.current.onInstanceSelected(micro));

      expect(result.current.selectedRegions).toEqual([fra]);
    });

    it('selects the first available region when all previously selected regions became unavailable', () => {
      micro.regions = ['fra'];

      const { result } = renderHook(() => useTest({ initialRegions: [par] }));

      act(() => result.current.onInstanceSelected(micro));

      expect(result.current.selectedRegions).toEqual([fra]);
    });
  });

  describe('region scope', () => {
    it('does not return a scope when there is no available region in the other scope', () => {
      regionAvailabilities[eu.identifier] = [false, 'unavailable'];

      const { result } = renderHook(() => useTest());

      expect(result.current.regionScope).toBeNull();
    });

    it('selects a region scope', () => {
      const { result } = renderHook(() => useTest());

      act(() => result.current.onRegionScopeSelected('continental'));

      expect(result.current.regionScope).toEqual<RegionScope>('continental');
    });

    it('selects the first available region in the selected scope', () => {
      const { result } = renderHook(() => useTest());

      act(() => result.current.onRegionScopeSelected('continental'));

      expect(result.current.selectedRegions).toEqual([eu]);
    });

    it.todo('changes the scope when no instance is available in the current one but some are in the other');
  });

  describe('region selection', () => {
    it('adds a region to the selection', () => {
      const { result } = renderHook(() => useTest({ initialRegions: [fra] }));

      act(() => result.current.onRegionSelected(par));

      expect(result.current.selectedRegions).toEqual([fra, par]);
    });

    it('removes a region from the selection', () => {
      const { result } = renderHook(() => useTest({ initialRegions: [fra, par] }));

      act(() => result.current.onRegionSelected(par));

      expect(result.current.selectedRegions).toEqual([fra]);
    });

    it('allows unselecting all regions', () => {
      const { result } = renderHook(() => useTest({ initialRegions: [fra] }));

      act(() => result.current.onRegionSelected(fra));

      expect(result.current.selectedRegions).toEqual([]);
    });
  });
});
