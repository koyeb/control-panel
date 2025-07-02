import { useCallback, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useParams, useSearch } from 'wouter';
import { navigate, usePathname, useHistoryState as useWouterHistoryState } from 'wouter/use-browser-location';

import { usePureFunction } from './lifecycle';

export { usePathname } from 'wouter/use-browser-location';

export function useLocation() {
  const pathname = usePathname();
  const search = useSearch();

  if (search.length === 0) {
    return pathname;
  }

  return `${pathname}?${search}`;
}

export function useRouteParam(name: string) {
  return useParams()[name] as string;
}

type HistoryState = Record<string, unknown>;

export function useHistoryState<T extends HistoryState>(): Partial<T> {
  return useWouterHistoryState() ?? {};
}

type SearchParam = string | number | boolean | null;
type SearchParams = Record<string, SearchParam | SearchParam[]>;

type NavigateOptions = {
  to?: string;
  search?: SearchParams | ((search: SearchParams) => SearchParams);
  replace?: boolean;
  state?: HistoryState;
};

export function useNavigate() {
  return useCallback(({ to, search, replace, state }: NavigateOptions) => {
    const url = new URL(to ?? window.location.pathname, window.location.origin);
    const searchParams = new URLSearchParams();

    const setParam = (key: string, value: SearchParam, set: 'set' | 'append' = 'set') => {
      if (value === null) {
        searchParams.delete(key);
      } else {
        searchParams[set](key, String(value));
      }
    };

    const updateSearchParams = (params: SearchParams) => {
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          value.forEach((value) => setParam(key, value, 'append'));
        } else {
          setParam(key, value);
        }
      }
    };

    if (typeof search === 'object') {
      updateSearchParams(search);
    }

    if (typeof search === 'function') {
      updateSearchParams(search(Object.fromEntries(new URLSearchParams(window.location.search))));
    }

    let result = url.pathname;

    if (searchParams.size > 0) {
      result += `?${searchParams.toString()}`;
    }

    navigate(result, { replace, state });
  }, []);
}

export function useSearchParams() {
  const search = useSearch();

  return useMemo(() => {
    return new URLSearchParams(search);
  }, [search]);
}

export function useSearchParam(
  name: string,
): [value: string | null, setValue: (string: string | null, options?: NavigateOptions) => void];

export function useSearchParam(
  name: string,
  options: { array: true },
): [value: string[], setValue: (value: string[], options?: NavigateOptions) => void];

export function useSearchParam(name: string, options?: { array: true }) {
  const searchParams = useSearchParams();
  const value = options?.array ? searchParams.getAll(name) : searchParams.get(name);

  const navigate = useNavigate();

  const setValue = useCallback(
    (value: string | string[] | null, options?: NavigateOptions) => {
      navigate({
        search: (prev) => ({ ...prev, [name]: value }),
        ...options,
      });
    },
    [name, navigate],
  );

  return [value, setValue as unknown] as const;
}

export function useOnRouteStateCreate(cb: () => void) {
  const historyState = useHistoryState<{ create: boolean }>();
  const navigate = useNavigate();
  const cbMemo = usePureFunction(cb);

  useEffect(() => {
    if (historyState.create) {
      navigate({ to: '#', replace: true, state: { create: false } });
      cbMemo();
    }
  }, [historyState, navigate, cbMemo]);
}
