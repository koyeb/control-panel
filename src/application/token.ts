import { createContext, createElement, useContext, useMemo } from 'react';

import { useLocalStorage, useSessionStorage } from 'src/hooks/storage';

const accessTokenContext = createContext<{
  token: string | undefined;
  setToken: (token: string) => void;
  clearToken: () => void;
}>(null as never);

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
