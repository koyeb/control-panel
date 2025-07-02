import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';

import { useApiMutationFn } from 'src/api/use-api';
import { usePathname } from 'src/hooks/router';
import { useStorage } from 'src/hooks/storage.new';

export function getToken() {
  return sessionStorage.getItem('session-token') ?? localStorage.getItem('access-token');
}

type AuthContext = {
  token: string | null;
  session: boolean;
  setToken: (token: string | null, session?: boolean) => void;
};

const authContext = createContext<AuthContext>(null as never);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const opts = { parse: String, stringify: String };
  const accessToken = useStorage('access-token', { storage: localStorage, ...opts });
  const sessionToken = useStorage('session-token', { storage: sessionStorage, ...opts });

  const [session, setSession] = useState(sessionToken.read() !== null);
  const [token, setToken] = useState(session ? sessionToken.read() : accessToken.read());

  const queryClient = useQueryClient();

  const value = useMemo<AuthContext>(
    () => ({
      token,
      session,
      setToken(token, session) {
        if (session && token === null) {
          setToken(accessToken.read());
        } else {
          setToken(token);
        }

        if (session !== undefined) {
          setSession(session ? token !== null : false);
        }

        void queryClient.cancelQueries();
        queryClient.clear();

        if (session) {
          sessionToken.write(token);
        } else {
          accessToken.write(token);
        }
      },
    }),
    [token, session, accessToken, sessionToken, queryClient],
  );

  useEffect(() => {
    return (session ? sessionToken : accessToken).listen(value.setToken);
  }, [session, sessionToken, accessToken, value]);

  return createElement(authContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(authContext);
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
