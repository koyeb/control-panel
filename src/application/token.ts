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

export function setToken(value: string | null, session = false) {
  if (session) {
    sessionToken.write(value);
  } else {
    accessToken.write(value);
    sessionToken.write(null);
  }

  token = getSnapshot();
  isSession = sessionToken.read() !== null;

  if (!isSession) {
    emitter.dispatchEvent(new Event('change'));
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
