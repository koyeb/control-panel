import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const match = window.matchMedia(query);

    const listener = (event: MediaQueryListEvent) => {
      setMatch(event.matches);
    };

    match.addEventListener('change', listener);

    return () => {
      match.removeEventListener('change', listener);
    };
  }, [query]);

  return match;
}
