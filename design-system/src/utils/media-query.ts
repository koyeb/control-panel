import { useState, useEffect } from 'react';

export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

// default tailwind breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useBreakpoint(breakpoint: keyof typeof breakpoints) {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}

function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const matchMedia = window.matchMedia(query);
    const handleChange = () => setMatches(getMatches(query));

    handleChange();

    matchMedia.addEventListener?.('change', handleChange);

    return () => {
      matchMedia.removeEventListener?.('change', handleChange);
    };
  }, [query]);

  return matches;
}

function getMatches(query: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(query).matches;
}
