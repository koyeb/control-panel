import { useMutation } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'wouter/use-browser-location';

import { useApiMutationFn } from 'src/api/use-api';
import { useMount } from 'src/hooks/lifecycle';
import { useSearchParam } from 'src/hooks/router';

interface TokenApi {
  read(this: void): string | undefined;
  write(this: void, value: string | undefined): void;
  listen(this: void, onChange: (value: string | undefined) => void): () => void;
}

function createTokenApi(storage: Storage, key: string): TokenApi {
  return {
    read() {
      return storage.getItem(key) ?? undefined;
    },

    write(token: string | undefined) {
      if (token === undefined) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, token);
      }
    },

    listen(onChange: (value: string | undefined) => void) {
      const listener = (event: StorageEvent) => {
        if (event.key === key) {
          onChange(event.newValue ?? undefined);
        }
      };

      window.addEventListener('storage', listener);

      return () => {
        window.removeEventListener('storage', listener);
      };
    },
  };
}

const accessTokenApi = createTokenApi(localStorage, 'access-token');
const sessionTokenApi = createTokenApi(sessionStorage, 'session-token');

export const getToken = () => sessionTokenApi.read() ?? accessTokenApi.read();

type TokenContext = {
  token: string | undefined;
  session?: true;
  setToken: (token: string) => void;
  clearToken: () => void;
};

const tokenContext = createContext<TokenContext>(null as never);

type TokenProviderProps = {
  children: React.ReactNode;
};

export function TokenProvider({ children }: TokenProviderProps) {
  const [tokenParam, setTokenParam] = useSearchParam('session-token');

  const accessToken = useTokenContext(accessTokenApi);
  const sessionToken = useTokenContext(sessionTokenApi, true);

  const value = useMemo(() => {
    if (sessionToken.token !== undefined) {
      return sessionToken;
    }

    return accessToken;
  }, [accessToken, sessionToken]);

  useMount(() => {
    if (tokenParam !== null) {
      sessionToken.setToken(tokenParam.replace(/^Bearer /, ''));
      setTokenParam(null);
    }
  });

  if (tokenParam !== null) {
    return null;
  }

  return createElement(tokenContext.Provider, { value }, children);
}

function useTokenContext({ read, write, listen }: TokenApi, session?: true) {
  const [token, setTokenState] = useState(read);

  const setToken = useCallback(
    (token: string | undefined) => {
      setTokenState(token);
      write(token);
    },
    [write],
  );

  const clearToken = useCallback(() => {
    setToken(undefined);
  }, [setToken]);

  useEffect(() => {
    return listen(setTokenState);
  }, [listen]);

  return useMemo<TokenContext>(
    () => ({
      token,
      session,
      setToken,
      clearToken,
    }),
    [token, session, setToken, clearToken],
  );
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
