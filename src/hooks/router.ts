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

type NavigateOptions = {
  to?: string | ((url: URL) => void);
  replace?: boolean;
  state?: HistoryState;
};

export function useNavigate() {
  return useCallback(({ to, replace, state }: NavigateOptions) => {
    if (typeof to === 'string') {
      navigate(to, { replace, state });
    } else if (typeof to === 'function') {
      const url = new URL(window.location.href);

      to(url);
      navigate(url, { replace, state });
    }
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
        to: (url) => {
          if (value === null) {
            url.searchParams.delete(name);
          }

          if (Array.isArray(value)) {
            url.searchParams.delete(name);
            value.forEach((value) => url.searchParams.append(name, value));
          }

          if (typeof value === 'string') {
            url.searchParams.set(name, value);
          }
        },
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
