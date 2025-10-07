import { QueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { StoredValue } from './storage';

const emitter = new EventTarget();

const accessToken = new StoredValue('access-token', {
  storage: localStorage,
  parse: String,
  stringify: String,
});

const sessionToken = new StoredValue('session-token', {
  storage: sessionStorage,
  parse: String,
  stringify: String,
});

let token = getSnapshot();
let isSession = sessionToken.read() !== null;

export function getToken() {
  return token;
}

export function isSessionToken() {
  return isSession;
}

export async function setToken(
  value: string | null,
  { queryClient, session }: { queryClient: QueryClient; session?: boolean },
) {
  if (session) {
    sessionToken.write(value);
  } else {
    sessionToken.write(null);
    accessToken.write(value);
    sessionToken.write(null);
  }

  token = getSnapshot();
  isSession = sessionToken.read() !== null;

  if (!isSession) {
    emitter.dispatchEvent(new Event('change'));
  }

  if (token) {
    queryClient.removeQueries({ predicate: (query) => !query.isActive() });
    await queryClient.invalidateQueries();
  } else {
    queryClient.clear();
  }
}

export function setAuthKitToken(value: string | null = null) {
  token = value;
}

export function accessTokenListener(cb: (value: string | null) => void) {
  return accessToken.listen(cb);
}

export function useToken() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

function subscribe(cb: () => void) {
  emitter.addEventListener('change', cb);

  return () => {
    emitter.removeEventListener('change', cb);
  };
}

function getSnapshot() {
  return sessionToken.read() ?? accessToken.read();
}
