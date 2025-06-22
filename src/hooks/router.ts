import {
  useParams,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
} from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports

import { usePureFunction } from './lifecycle';

export function useLocation() {
  return useTanstackLocation().href;
}

export function usePathname() {
  return useTanstackLocation().pathname;
}

export function useRouteParam(name: string) {
  return useParams({})[name] as string;
}

type HistoryState = Record<string, unknown>;

export function useHistoryState<T extends HistoryState>(): Partial<T> {
  return useTanstackLocation().state;
}

type NavigateOptions = {
  replace?: boolean;
  state?: HistoryState;
};

type Navigate = (
  param: string | URL | ((url: URL) => string | URL | void),
  options?: NavigateOptions,
) => void;

export function useNavigate() {
  const navigate = useTanstackNavigate();

  return useCallback<Navigate>(
    (param, options) => {
      if (typeof param === 'string' || param instanceof URL) {
        navigate({ to: String(param), ...options });
      } else {
        const url = new URL(window.location.href);
        const result = param(url);

        navigate({ to: String(result), ...options });
      }
    },
    [navigate],
  );
}

export function useSearchParams() {
  const location = useTanstackLocation();

  return useMemo(() => {
    return new URLSearchParams(location.searchStr);
  }, [location.searchStr]);
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

  const navigate = useTanstackNavigate();

  const setValue = useCallback(
    (value: string | string[] | null, options?: NavigateOptions) => {
      const url = new URL('http://localhost');

      url.search = new URLSearchParams(searchParams).toString();

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

      navigate({
        ...options,
        to: window.location.pathname,
        search: Object.fromEntries(url.searchParams.entries()),
      });
    },
    [name, searchParams, navigate],
  );

  return [value, setValue as unknown] as const;
}

export function useOnRouteStateCreate(cb: () => void) {
  const historyState = useHistoryState<{ create: boolean }>();
  const navigate = useNavigate();
  const cbMemo = usePureFunction(cb);

  useEffect(() => {
    if (historyState.create) {
      navigate('#', { replace: true, state: { create: false } });
      cbMemo();
    }
  }, [historyState, navigate, cbMemo]);
}
