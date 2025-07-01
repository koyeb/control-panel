import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { usePathname } from 'wouter/use-browser-location';

import { useApiMutationFn } from 'src/api/use-api';
import { useStorage } from 'src/hooks/storage.new';

export function getToken() {
  return sessionStorage.getItem('session-token') ?? localStorage.getItem('access-token');
}

type TokenContext = {
  token: string | null;
  session: boolean;
  setToken: (token: string | null, session?: boolean) => void;
  clearToken: () => void;
};

const tokenContext = createContext<TokenContext>(null as never);

type TokenProviderProps = {
  children: React.ReactNode;
};

export function TokenProvider({ children }: TokenProviderProps) {
  const opts = { parse: String, stringify: String };
  const accessToken = useStorage('access-token', { storage: localStorage, ...opts });
  const sessionToken = useStorage('session-token', { storage: sessionStorage, ...opts });

  const [session, setSession] = useState(sessionToken.read() !== null);
  const [token, setToken] = useState(session ? sessionToken.read() : accessToken.read());

  const queryClient = useQueryClient();

  const value: TokenContext = {
    token,
    session,
    setToken(token, session) {
      if (session && token === null) {
        setToken(accessToken.read());
      } else {
        setToken(token);
      }

      if (session !== undefined) {
        setSession(token !== null);
      }

      queryClient.cancelQueries();
      queryClient.clear();

      if (session) {
        sessionToken.write(token);
      } else {
        accessToken.write(token);
      }
    },
    clearToken() {
      setToken(null);

      queryClient.cancelQueries();
      queryClient.clear();

      if (session) {
        sessionToken.write(null);
      } else {
        accessToken.write(null);
      }
    },
  };

  return createElement(tokenContext.Provider, { value }, children);
}

export function useToken() {
  return useContext(tokenContext);
}

export function useRefreshToken() {
  const { token, setToken } = useToken();
  const pathname = usePathname();

  const { mutate } = useMutation({
    ...useApiMutationFn('refreshToken', {}),
    onSuccess: ({ token }) => setToken(token!.id!),
  });

  useEffect(() => {
    const expires = token ? jwtExpires(token) : undefined;

    if (expires !== undefined && isAfter(new Date(), sub(expires, { hours: 12 }))) {
      mutate();
    }
  }, [pathname, token, mutate]);
}

function jwtExpires(jwt: string) {
  const { exp } = jwtDecode(jwt);

  if (exp !== undefined) {
    return new Date(exp * 1000);
  }
}
