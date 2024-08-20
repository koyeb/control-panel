import { useEffect } from 'react';

export function useIntersectionObserver(
  element: HTMLElement | null,
  options: IntersectionObserverInit | undefined,
  callback: (entry: IntersectionObserverEntry) => void,
) {
  useEffect(() => {
    if (element === null) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => callback(entry));
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, callback, options]);
}
