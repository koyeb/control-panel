import { useCallback, useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useParams, useSearch } from 'wouter';
import { navigate, usePathname } from 'wouter/use-browser-location';

export { usePathname, useHistoryState } from 'wouter/use-browser-location';

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

type HistoryState = {
  clearCache?: boolean;
};

type NavigateOptions = {
  replace?: boolean;
  state?: HistoryState;
};

type Navigate = (
  param: string | URL | ((url: URL) => string | URL | void),
  options?: NavigateOptions,
) => void;

export function useNavigate() {
  return useCallback<Navigate>((param, options) => {
    if (typeof param === 'string' || param instanceof URL) {
      navigate(param, options);
    } else {
      const url = new URL(window.location.href);
      const result = param(url);

      navigate(result ?? url, options);
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
      navigate((url) => {
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
      }, options);
    },
    [name, navigate],
  );

  return [value, setValue as unknown] as const;
}
