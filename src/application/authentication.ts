import { useQueryClient } from '@tanstack/react-query';
import { type ParsedLocation, redirect } from '@tanstack/react-router';
import { useCallback } from 'react';
import { createStoredData } from './storage';

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
  const queryClient = useQueryClient();

  return useCallback(
    (token: string | null) => {
      setToken(token);
      queryClient.clear();
    },
    [queryClient],
  );
}

export function isAuthenticated() {
  return getToken() !== null;
}

export function redirectToSignIn(location: ParsedLocation): never {
  throw redirect({
    to: '/auth/signin',
    replace: true,
    search: {
      next: location.href !== '/' ? location.href : undefined,
    },
  });
}
