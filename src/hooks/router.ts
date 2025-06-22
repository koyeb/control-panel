import {
  useParams,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
} from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

import { assert } from 'src/utils/assert';
import { usePureFunction } from './lifecycle';

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

type Navigate = (to: string, options?: NavigateOptions) => void;

export function useNavigate() {
  const navigate = useTanstackNavigate();

  return useCallback<Navigate>(
    (to, options) => {
      navigate({ to, ...options });
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
