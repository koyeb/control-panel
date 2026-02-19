import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounce(fn: () => void, ms: number, deps: React.DependencyList = []): void {
  useEffect(() => {
    const timeout = setTimeout(fn, ms);

    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}

export function useDebouncedCallback<Args extends unknown[]>(
  cb: (...args: Args) => void,
  ms: number,
): [(...args: Args) => void, { isDebouncing: boolean; clear: () => void }] {
  const timeout = useRef<number>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const clear = useCallback(() => {
    window.clearTimeout(timeout.current!);
    setIsDebouncing(false);
  }, []);

  const callback = useCallback(
    (...args: Args) => {
      if (timeout.current) {
        clear();
      }

      setIsDebouncing(true);

      timeout.current = window.setTimeout(() => {
        timeout.current = null;
        setIsDebouncing(false);
        cb(...args);
      }, ms);
    },
    [clear, cb, ms],
  );

  return [callback, { isDebouncing, clear }];
}

export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);

  useDebounce(() => setDebounced(value), ms, [value]);

  return debounced;
}

export function useNow() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return now;
}
