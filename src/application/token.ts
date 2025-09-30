import { StoredValue } from './storage';

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

let token = sessionToken.read() ?? accessToken.read();

export function getToken() {
  return token;
}

export function setToken(value: string | null, session?: boolean) {
  if (session) {
    sessionToken.write(value);
  } else {
    accessToken.write(value);
  }

  token = sessionToken.read() ?? accessToken.read();
}
