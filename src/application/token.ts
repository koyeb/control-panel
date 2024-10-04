import { useMutation } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { createContext, createElement, useContext, useEffect, useMemo } from 'react';
import { usePathname } from 'wouter/use-browser-location';

import { useApiMutationFn } from 'src/api/use-api';
import { useLocalStorage, useSessionStorage } from 'src/hooks/storage';

type AccessTokenContext = {
  token: string | undefined;
  setToken: (token: string) => void;
  clearToken: () => void;
};

const accessTokenContext = createContext<AccessTokenContext>(null as never);

type AccessTokenProviderProps = {
  children: React.ReactNode;
};

export function AccessTokenProvider({ children }: AccessTokenProviderProps) {
  const [accessToken, setToken, clearToken] = useLocalStorage('access-token', {
    parse: String,
    stringify: String,
  });

  const [sessionToken] = useSessionStorage('session-token', {
    parse: String,
    stringify: String,
  });

  const token = sessionToken ?? accessToken;

  const value = useMemo(
    () => ({
      token,
      setToken,
      clearToken,
    }),
    [token, setToken, clearToken],
  );

  return createElement(accessTokenContext.Provider, { value }, children);
}

export function useAccessToken() {
  return useContext(accessTokenContext);
}

export function getAccessToken(): string | null {
  return getSessionToken() ?? localStorage.getItem('access-token');
}

export function getSessionToken() {
  return sessionStorage.getItem('session-token');
}

export function useRefreshToken() {
  const { token, setToken } = useAccessToken();
  const pathname = usePathname();

  const { mutate } = useMutation({
    ...useApiMutationFn('refreshToken', {}),
    onSuccess({ token }) {
      setToken(token!.id!);
    },
  });

  useEffect(() => {
    const expires = token ? jwtExpires(token) : undefined;

    if (expires === undefined) {
      return;
    }

    if (isAfter(new Date(), sub(expires, { hours: 12 }))) {
      mutate();
    }
  }, [pathname, token, mutate]);
}

function jwtExpires(jwt: string) {
  const { exp } = jwtDecode(jwt);

  if (exp === undefined) {
    return;
  }

  return new Date(exp * 1000);
}
