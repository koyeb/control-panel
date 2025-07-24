import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';
import { getConfig } from 'src/utils/config';

import { createApi } from './create-api';

type Endpoint = keyof typeof api;

export type ApiEndpointParams<E extends Endpoint> = ApiEndpoints[E]['params'];
export type ApiEndpointResult<E extends Endpoint> = ApiEndpoints[E]['result'];

type ApiEndpoints = {
  [E in Endpoint]: {
    params: Parameters<(typeof api)[E]>[0];
    result: Awaited<ReturnType<(typeof api)[E]>>;
  };
};

export const api = createApi({
  baseUrl: getConfig('apiBaseUrl'),
  getToken: () => container.resolve(TOKENS.authentication).token,
});

declare global {
  interface Window {
    api: typeof api;
    sockets: WebSocket[];
  }
}

if (typeof window !== 'undefined') {
  window.api = api;
}
