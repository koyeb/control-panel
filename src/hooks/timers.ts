import { useEffect, useState } from 'react';

export function useDebounce(fn: () => void, ms: number, deps: React.DependencyList = []): void {
  useEffect(() => {
    const timeout = setTimeout(fn, ms);

    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}

export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);

  useDebounce(() => setDebounced(value), ms, [value]);

  return debounced;
}
