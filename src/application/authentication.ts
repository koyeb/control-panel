import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { TOKENS } from 'src/tokens';

import { container } from './container';
import { StoredValue } from './storage';
import { setToken } from './token';

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

  constructor() {
    this.accessToken = new StoredValue('access-token', {
      storage: localStorage,
      parse: String,
      stringify: String,
    });

    this.sessionToken = new StoredValue('session-token', {
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
      setToken(token);

      if (auth.token) {
        queryClient.removeQueries({ predicate: (query) => !query.isActive() });
        await queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    },
    [queryClient],
  );
}
