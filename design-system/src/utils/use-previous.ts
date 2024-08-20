import { useRef, useEffect } from 'react';

export function usePrevious<T>(value: T) {
  const prev = useRef(value);

  useEffect(() => {
    prev.current = value;
  }, [value]);

  return prev.current;
}
