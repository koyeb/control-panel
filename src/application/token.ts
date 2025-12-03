type GetAccessToken = () => Promise<string>;

let _getAccessToken: GetAccessToken;
let sessionToken: string | null = null;

export function setGetAccessToken(getAccessToken: GetAccessToken) {
  _getAccessToken = () => getAccessToken();
}

export function setSessionToken(token: string) {
  sessionToken = token;
}

export function getToken() {
  if (sessionToken) {
    return Promise.resolve(sessionToken);
  }

  return _getAccessToken();
}

export function isSessionToken() {
  return sessionToken !== null;
}
