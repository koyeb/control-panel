import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { TOKENS } from 'src/tokens';

import { container } from './container';
import { StoragePort, StoredValue } from './storage';

export interface AuthenticationPort {
  get token(): string | null;
  get session(): boolean;

  setToken(token: string | null, session?: boolean): void;
  listen(onChange: () => void): () => void;
}

export class StorageAuthenticationAdapter implements AuthenticationPort {
  private accessToken: StoredValue<string>;
  private sessionToken: StoredValue<string>;

  public token: string | null;
  public session: boolean;

  constructor(storage: StoragePort) {
    this.accessToken = storage.value('access-token', {
      storage: localStorage,
      parse: String,
      stringify: String,
    });

    this.sessionToken = storage.value('session-token', {
      storage: sessionStorage,
      parse: String,
      stringify: String,
    });

    this.token = this.sessionToken.read() ?? this.accessToken.read();
    this.session = this.sessionToken.read() !== null;
  }

  setToken(value: string | null, session?: boolean): void {
    if (session) {
      this.sessionToken.write(value);
    } else {
      this.accessToken.write(value);
      this.sessionToken.write(null);
    }

    this.token = this.sessionToken.read() ?? this.accessToken.read();
    this.session = this.sessionToken.read() !== null;
  }

  listen(onChange: () => void): () => void {
    return this.accessToken.listen((value) => {
      if (!this.session) {
        this.token = value;
        onChange();
      }
    });
  }
}

export function useSetToken() {
  const queryClient = useQueryClient();

  return useCallback(
    async (token: string | null, session?: boolean) => {
      const auth = container.resolve(TOKENS.authentication);

      auth.setToken(token, session);

      if (auth.token) {
        const queriesToKeep: unknown[] = ['getCurrentUser', 'getCurrentOrganization'];

        queryClient.removeQueries({
          predicate: (query) => !queriesToKeep.includes(query.queryKey[0]),
        });

        await queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    },
    [queryClient],
  );
}

export function useTokenParams() {
  const params = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const sessionToken = params.get('session-token');

  const auth = container.resolve(TOKENS.authentication);

  useMount(() => {
    if (token !== null) {
      auth.setToken(token);
      navigate({ search: (prev) => ({ ...prev, token: null }) });
    }

    if (sessionToken !== null) {
      auth.setToken(sessionToken, true);
      navigate({ search: (prev) => ({ ...prev, 'session-token': null }) });
    }
  });

  return token !== null || sessionToken !== null;
}

export function useTokenStorageListener() {
  const queryClient = useQueryClient();
  const auth = container.resolve(TOKENS.authentication);

  useEffect(() => {
    return auth.listen(() => void queryClient.invalidateQueries());
  }, [auth, queryClient]);
}
