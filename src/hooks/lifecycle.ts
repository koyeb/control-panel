// cspell:word dequal
import { dequal as deepEqual } from 'dequal';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

/* eslint-disable react-hooks/exhaustive-deps */

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function usePureFunction<Fn extends Function>(fn: Fn) {
  return useCallback(fn, []);
}

export function useMount(effect: React.EffectCallback) {
  const isMount = useRef(true);

  useEffect(() => {
    if (isMount.current) {
      return effect();
    } else {
      isMount.current = false;
    }
  }, []);
}

export function useUpdateEffect(effect: React.EffectCallback, deps: React.DependencyList) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      effect();
    }
  }, deps);
}

export function useUpdateLayoutEffect(effect: React.EffectCallback, deps: React.DependencyList) {
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      effect();
    }
  }, deps);
}

export function usePrevious<T>(value: T) {
  const prev = useRef(value);

  useEffect(() => {
    prev.current = value;
  }, [value]);

  return prev.current;
}

export function useObserve<T>(value: T, cb: (value: T) => void) {
  const valueMemo = useDeepCompareMemo(value);

  useEffect(() => {
    cb(value);
  }, [valueMemo]);
}

export const useDeepCompareMemo = <T>(value: T) => {
  return useMemo(() => value, useDeepCompareMemoize([value]));
};

const useDeepCompareMemoize = (value: React.DependencyList) => {
  const ref = useRef<React.DependencyList>([]);

  if (!deepEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
};
