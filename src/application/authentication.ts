import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect } from 'react';

import { useApiMutationFn } from 'src/api/use-api';
import { usePathname } from 'src/hooks/router';
import { inArray } from 'src/utils/arrays';

import { createStorage } from './storage';

const opts = { parse: String, stringify: String };
const accessToken = createStorage('access-token', { storage: localStorage, ...opts });
const sessionToken = createStorage('session-token', { storage: sessionStorage, ...opts });

export const auth = {
  token: sessionToken.read() ?? accessToken.read(),
  session: sessionToken.read() !== null,
  setToken: (value: string | null, session?: boolean) => {
    if (session) {
      sessionToken.write(value);
    } else {
      accessToken.write(value);
    }

    auth.token = sessionToken.read() ?? accessToken.read();
    auth.session = sessionToken.read() !== null;
  },
};

export function getToken() {
  return auth.token;
}

function useSetToken() {
  const queryClient = useQueryClient();

  return useCallback<typeof auth.setToken>(
    async (token, session) => {
      await queryClient.cancelQueries();

      auth.setToken(token, session);

      if (getToken()) {
        const queriesToKeep = ['getCurrentUser', 'getCurrentOrganization', 'getSubscription'];

        queryClient.removeQueries({
          predicate: ({ queryKey }) => !inArray(queryKey[0], queriesToKeep),
        });

        await queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    },
    [queryClient],
  );
}

export function useAuth() {
  const setToken = useSetToken();

  return {
    ...auth,
    setToken,
  };
}

export function useRefreshToken() {
  const { session, token, setToken } = useAuth();
  const pathname = usePathname();

  const { mutate } = useMutation({
    ...useApiMutationFn('refreshToken', {}),
    onSuccess: ({ token }) => setToken(token!.id!),
  });

  useEffect(() => {
    const expires = token ? jwtExpires(token) : undefined;

    if (!session && expires !== undefined && isAfter(new Date(), sub(expires, { hours: 12 }))) {
      mutate();
    }
  }, [session, pathname, token, mutate]);
}

function jwtExpires(jwt: string) {
  const { exp } = jwtDecode(jwt);

  if (exp !== undefined) {
    return new Date(exp * 1000);
  }
}
