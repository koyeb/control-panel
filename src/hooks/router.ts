import {
  useParams,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
} from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';
// eslint-disable-next-line no-restricted-imports

import { assert } from 'src/utils/assert';
import { usePureFunction } from './lifecycle';

declare module '@tanstack/react-router' {
  // ...

  interface HistoryState {
    githubAppInstallationRequested?: boolean;
    createOrganization?: boolean;
    create?: boolean;
  }
}

export function useLocation() {
  return useTanstackLocation().href;
}

export function usePathname() {
  return useTanstackLocation().pathname;
}

export function useRouteParam(name: string) {
  const params = useParams({ strict: false });
  const value = params[name as keyof typeof params];

  assert(value !== undefined);

  return value;
}

type HistoryState = Record<string, unknown>;

export function useHistoryState() {
  return useTanstackLocation({ select: (s) => s.state });
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
  return new URLSearchParams(useTanstackLocation({ select: (s) => s.searchStr }));
}

export function useOnRouteStateCreate(cb: () => void) {
  const historyState = useHistoryState();
  const navigate = useNavigate();
  const cbMemo = usePureFunction(cb);

  useEffect(() => {
    if (historyState.create) {
      navigate('#', { replace: true, state: { create: false } });
      cbMemo();
    }
  }, [historyState, navigate, cbMemo]);
}
