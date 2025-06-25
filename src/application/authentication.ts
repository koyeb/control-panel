import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { createStoredData } from './storage';
import { useRouter } from '@tanstack/react-router';

const accessToken = createStoredData(localStorage, 'access-token');
const sessionToken = createStoredData(sessionStorage, 'session-token');

export function getToken() {
  return sessionToken.read() ?? accessToken.read();
}

export function setToken(token: string | null, session = false) {
  if (session) {
    sessionToken.write(token);
  } else {
    accessToken.write(token);
  }
}

export function isSessionToken() {
  return sessionToken.read() !== null;
}

export function useSetToken() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(
    (token: string | null) => {
      setToken(token);

      if (token === null) {
        void queryClient.clear();
      } else {
        void queryClient.invalidateQueries();
      }

      void router.invalidate();
    },
    [router, queryClient],
  );
}

export function isAuthenticated() {
  return getToken() !== null;
}
