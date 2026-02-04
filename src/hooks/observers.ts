import { useCallback } from 'react';

export function useResizeObserver(
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions,
  deps: React.DependencyList = [],
) {
  return useCallback((ref: HTMLDivElement | null) => {
    if (!ref) {
      return;
    }

    const observer = new ResizeObserver(callback);

    observer.observe(ref, options);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
  deps: React.DependencyList = [],
) {
  return useCallback((ref: HTMLDivElement | null) => {
    if (!ref) {
      return;
    }

    const observer = new IntersectionObserver(callback, options);

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
