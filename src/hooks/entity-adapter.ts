import { useCallback, useState } from 'react';

import { usePureFunction } from './lifecycle';

type UseMap<Key, Value> = [
  map: Map<Key, Value>,
  {
    addOne: (item: Value) => void;
    addMany: (...items: Value[]) => void;
    clear: () => void;
  },
];

/**
 * Manage a collection of entities, stable across re-renders
 * Inspired by https://redux-toolkit.js.org/api/createEntityAdapter
 */
export function useEntityAdapter<Key, Value>(
  getKey: (item: Value) => Key,
  initial: Array<Value> = [],
): UseMap<Key, Value> {
  // assuming that getKey is pure
  const key = usePureFunction(getKey);

  const [items, setItems] = useState(new Map(initial.map((item) => [key(item), item])));

  const update = useCallback((updater: (map: Map<Key, Value>) => void) => {
    setItems((map) => {
      const clone = new Map(map.entries());

      updater(clone);

      return clone;
    });
  }, []);

  return [
    items,
    {
      addOne: useCallback(
        (item) => {
          update((map) => {
            if (!map.has(key(item))) {
              map.set(key(item), item);
            }
          });
        },
        [update, key],
      ),

      addMany: useCallback(
        (...items) => {
          if (items.length === 0) {
            return;
          }

          update((map) => {
            for (const item of items) {
              if (!map.has(key(item))) {
                map.set(key(item), item);
              }
            }
          });
        },
        [update, key],
      ),

      clear: useCallback(() => {
        setItems(new Map());
      }, []),
    },
  ];
}
