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
      };
    }, [update]),
  ] as const;
}
