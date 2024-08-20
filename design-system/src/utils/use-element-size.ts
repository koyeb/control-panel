import { useEffect, useState } from 'react';

export function useElementSize(element: HTMLElement | null) {
  const [size, setSize] = useState<{ width?: number; height?: number }>({});

  useWatchElementSize(element, setSize);

  return size;
}

type WatchElementSizeCallback = (size: { width: number; height: number }) => void;

export function useWatchElementSize(element: HTMLElement | null, callback: WatchElementSizeCallback) {
  useEffect(() => {
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const borderBoxSize = entry.borderBoxSize[0];

        if (!borderBoxSize) {
          continue;
        }

        callback({
          width: borderBoxSize.inlineSize,
          height: borderBoxSize.blockSize,
        });
      }
    });

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [element, callback]);
}
