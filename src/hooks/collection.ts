import { useState, useMemo, useCallback } from 'react';

export function useSet<T>(initial?: Iterable<T>) {
  const [set, setSet] = useState(new Set(initial));

  const update = useCallback((updater: (set: Set<T>) => void) => {
    return setSet((set) => {
      const newSet = new Set(set);

      updater(newSet);

      return newSet;
    });
  }, []);

  return [
    set,
    useMemo(() => {
      return {
        set: (values: T[]) => setSet(new Set(values)),
        add: (value: T) => update((set) => set.add(value)),
        remove: (value: T) => update((set) => set.delete(value)),
        toggle: (value: T) => update((set) => (set.has(value) ? set.delete(value) : set.add(value))),
        clear: () => update((set) => set.clear()),
      };
    }, [update]),
  ] as const;
}

export function useMap<K, V>(initial?: Iterable<[K, V]>) {
  const [map, setMap] = useState(new Map(initial));

  const update = useCallback((updater: (map: Map<K, V>) => void) => {
    return setMap((map) => {
      const newMap = new Map(map);

      updater(newMap);

      return newMap;
    });
  }, []);

  return [
    map,
    useMemo(() => {
      return {
        set: (values: Iterable<[K, V]>) => setMap(new Map(values)),
        add: (key: K, value: V) => update((map) => map.set(key, value)),
        remove: (key: K) => update((map) => map.delete(key)),
      };
    }, [update]),
  ] as const;
}
