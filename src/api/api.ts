import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';

import { createApi } from './create-api';

export type ApiPort = ReturnType<typeof createApi>;

type Endpoint = keyof ApiPort;

export type ApiEndpointParams<E extends Endpoint> = ApiEndpoints[E]['params'];
export type ApiEndpointResult<E extends Endpoint> = ApiEndpoints[E]['result'];

type ApiEndpoints = {
  [E in Endpoint]: {
    params: Parameters<ApiPort[E]>[0];
    result: Awaited<ReturnType<ApiPort[E]>>;
  };
};

export const api = () => container.resolve(TOKENS.api);
