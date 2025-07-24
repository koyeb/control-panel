import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect } from 'react';

import { useApiMutationFn } from 'src/api/use-api';
import { usePathname } from 'src/hooks/router';
import { TOKENS } from 'src/tokens';
import { inArray } from 'src/utils/arrays';

import { container } from './container';

const storage = container.resolve(TOKENS.storage);

const opts = { parse: String, stringify: String };
const accessToken = storage.value('access-token', { storage: localStorage, ...opts });
const sessionToken = storage.value('session-token', { storage: sessionStorage, ...opts });

export const auth = {
  token: sessionToken.read() ?? accessToken.read(),
  session: sessionToken.read() !== null,
  setToken: (value: string | null, session?: boolean) => {
    if (session) {
      sessionToken.write(value);
    } else {
      accessToken.write(value);
      sessionToken.write(null);
    }

    auth.token = sessionToken.read() ?? accessToken.read();
    auth.session = sessionToken.read() !== null;
  },
};

declare global {
  interface Window {
    auth: typeof auth;
  }
}

window.auth = auth;

export function getToken() {
  return auth.token;
}

export function useSetToken() {
  const queryClient = useQueryClient();

  return useCallback(
    (token: string | null, session?: boolean) => {
      auth.setToken(token, session);

      void queryClient.cancelQueries();

      if (getToken()) {
        const queriesToKeep = ['getCurrentUser', 'getCurrentOrganization', 'getSubscription'];

        queryClient.removeQueries({
          predicate: ({ queryKey }) => !inArray(queryKey[0], queriesToKeep),
        });

        void queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    },
    [queryClient],
  );
}

export function useRefreshToken() {
  const pathname = usePathname();

  const { mutate } = useMutation({
    ...useApiMutationFn('refreshToken', {}),
    onSuccess: ({ token }) => auth.setToken(token!.id!),
  });

  useEffect(() => {
    if (auth.session) {
      return;
    }

    const expires = auth.token ? jwtExpires(auth.token) : undefined;

    if (expires !== undefined && isAfter(new Date(), sub(expires, { hours: 12 }))) {
      mutate();
    }
  }, [pathname, mutate]);
}

function jwtExpires(jwt: string) {
  const { exp } = jwtDecode(jwt);

  if (exp !== undefined) {
    return new Date(exp * 1000);
  }
}

export function useTokenStorageListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return accessToken.listen((value) => {
      auth.token = value;
      auth.session = false;
      void queryClient.invalidateQueries();
    });
  }, [queryClient]);

  useEffect(() => {
    return sessionToken.listen((value) => {
      auth.token = value;
      auth.session = true;
      void queryClient.invalidateQueries();
    });
  }, [queryClient]);
}
