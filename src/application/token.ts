type GetAccessToken = () => Promise<string>;

let _getAccessToken: GetAccessToken;

export function setGetAccessToken(getAccessToken: GetAccessToken) {
  _getAccessToken = () => getAccessToken();
}

export function getToken() {
  return _getAccessToken();
}
