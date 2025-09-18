import {
  ValidateLinkOptions,
  useNavigate,
  useParams,
  useLocation as useTanstackLocation,
} from '@tanstack/react-router';
import { useEffect } from 'react';

import { assert } from 'src/utils/assert';
import { toObject } from 'src/utils/object';

import { usePureFunction } from './lifecycle';

export { useNavigate };

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

export function useHistoryState() {
  return useTanstackLocation({ select: (s) => s.state });
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(useTanstackLocation({ select: (s) => s.searchStr }));
}

export function urlToLinkOptions(url: string | URL): ValidateLinkOptions {
  const { pathname, searchParams } = new URL(url, window.location.origin);

  return {
    to: pathname,
    search: toObject(
      Array.from(searchParams.entries()),
      ([key]) => key,
      ([, value]) => value,
    ),
  } as unknown as ValidateLinkOptions;
}

export function useOnRouteStateCreate(cb: () => void) {
  const historyState = useHistoryState();
  const navigate = useNavigate();
  const cbMemo = usePureFunction(cb);

  useEffect(() => {
    if (historyState.create) {
      void navigate({ to: '.', replace: true, state: { create: false } });
      // wait for the command palette to be closed
      setTimeout(cbMemo, 0);
    }
  }, [historyState, navigate, cbMemo]);
}
