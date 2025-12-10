import { getAuthKitToken } from './authkit';

let token: string | null = null;
let isSession = false;

export async function getToken() {
  return token ?? getAuthKitToken();
}

export function isSessionToken() {
  return isSession;
}

export function setToken(value: string | null, session = false) {
  token = value;
  isSession = session;
}
