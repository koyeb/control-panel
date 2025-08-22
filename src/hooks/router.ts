import { useCallback, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useParams, useSearch } from 'wouter';
import { navigate, usePathname, useHistoryState as useWouterHistoryState } from 'wouter/use-browser-location';

import { AssertionError, defined } from 'src/utils/assert';
import { toObject } from 'src/utils/object';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useHistoryState(): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return useWouterHistoryState() ?? {};
}

export type SearchParam = string | number | boolean | null | undefined;
export type SearchParams = Record<string, SearchParam | SearchParam[]>;

type NavigateOptions = {
  to?: string;
  params?: Record<string, string>;
  search?: SearchParams | ((search: SearchParams) => SearchParams);
  replace?: boolean;
  state?: HistoryState;
};

export function useNavigate() {
  return useCallback(({ to, search, params, replace, state }: NavigateOptions) => {
    navigate(getNavigateUrl({ to, params, search }), { replace, state });
  }, []);
}

export function getNavigateUrl({ to, params, search }: Pick<NavigateOptions, 'to' | 'params' | 'search'>) {
  const url = new URL(to ?? window.location.pathname, window.location.origin);
  const searchParams = new URLSearchParams();

  const setParam = (key: string, value: SearchParam, set: 'set' | 'append' = 'set') => {
    if (value === null) {
      searchParams.delete(key);
    } else if (value !== undefined) {
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
    const params = new URLSearchParams(window.location.search);
    const entries: SearchParams = {};

    for (const key of params.keys()) {
      const value = params.getAll(key);

      if (Array.isArray(value)) {
        entries[key] = value;
      } else {
        entries[key] = value[0];
      }
    }

    updateSearchParams(search(entries));
  }

  let result = replacePathParams(url.pathname, params);

  if (searchParams.size > 0) {
    result += `?${searchParams.toString()}`;
  }

  return result;
}

function replacePathParams(to: string, params?: Record<string, string>) {
  return to.replaceAll(/\$([a-zA-Z]+)/g, (match, key: string) => {
    return defined(params?.[key], new AssertionError(`Missing link param for ${key}`));
  });
}

export function urlToLinkOptions(url: string) {
  const { pathname, searchParams } = new URL(url, window.location.origin);

  return {
    to: pathname,
    search: toObject(
      Array.from(searchParams.entries()),
      ([key]) => key,
      ([, value]) => value,
    ),
  };
}

export function useSearchParams() {
  const search = useSearch();

  return useMemo(() => {
    return new URLSearchParams(search);
  }, [search]);
}

export function useOnRouteStateCreate(cb: () => void) {
  const historyState = useHistoryState();
  const navigate = useNavigate();
  const cbMemo = usePureFunction(cb);

  useEffect(() => {
    if (historyState.create) {
      navigate({ replace: true, state: { create: false } });
      cbMemo();
    }
  }, [historyState, navigate, cbMemo]);
}
