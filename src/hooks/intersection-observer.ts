import { useEffect } from 'react';

export function useIntersectionObserver(
  target: Element | null,
  options: IntersectionObserverInit,
  cb: IntersectionObserverCallback,
  deps: React.DependencyList,
) {
  useEffect(() => {
    if (target === null) {
      return;
    }

    const observer = new IntersectionObserver(cb, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
