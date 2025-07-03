import { useQueryClient } from '@tanstack/react-query';
import { ValidateNavigateOptions } from '@tanstack/react-router';
import { useCallback } from 'react';

import { useNavigate } from 'src/hooks/router';

import { createStorage } from './storage';

const opts = { parse: String, stringify: String };
const accessToken = createStorage('access-token', { storage: localStorage, ...opts });
const sessionToken = createStorage('session-token', { storage: sessionStorage, ...opts });

export const auth = {
  token: sessionToken.read() ?? accessToken.read(),
  session: sessionToken.read() !== null,
  setToken: (value: string | null, session?: boolean) => {
    if (session) {
      sessionToken.write(value);
    } else {
      sessionToken.write(null);
      accessToken.write(value);
    }

    auth.token = sessionToken.read() ?? accessToken.read();
    auth.session = sessionToken.read() !== null;
  },
};

window.auth = auth;

declare global {
  interface Window {
    auth: typeof auth;
  }
}

export function getToken() {
  return auth.token;
}

export function useSetToken() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(
    async (
      token: string | null,
      { session, redirect }: { session?: boolean; redirect?: ValidateNavigateOptions } = {},
    ) => {
      await queryClient.cancelQueries();

      auth.setToken(token, session);

      if (redirect) {
        await navigate(redirect);
      }

      if (getToken()) {
        queryClient.removeQueries({
          predicate: ({ queryKey }) =>
            queryKey[0] !== 'getCurrentUser' && queryKey[0] !== 'getCurrentOrganization',
        });

        await queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    },
    [queryClient, navigate],
  );
}
