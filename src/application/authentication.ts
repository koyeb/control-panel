import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect } from 'react';

import { useApiMutationFn } from 'src/api/use-api';
import { usePathname } from 'src/hooks/router';
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
        await queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    },
    [queryClient],
  );
}

export function useRefreshToken() {
  const pathname = usePathname();
  const auth = container.resolve(TOKENS.authentication);

  const { mutate } = useMutation({
    ...useApiMutationFn('refreshToken', {}),
    onSuccess: ({ token }) => auth.setToken(token!.id!),
  });

  useEffect(() => {
    if (auth.session) {
      return;
    }

    const expires = auth.token ? jwtExpires(auth.token) : undefined;

    if (expires !== undefined && isAfter(new Date(), sub(expires, { hours: 12 }))) {
      mutate();
    }
  }, [auth, pathname, mutate]);
}

function jwtExpires(jwt: string) {
  try {
    const { exp } = jwtDecode(jwt);

    if (exp !== undefined) {
      return new Date(exp * 1000);
    }
  } catch {
    return undefined;
  }
}

export function useTokenStorageListener() {
  const queryClient = useQueryClient();
  const auth = container.resolve(TOKENS.authentication);

  useEffect(() => {
    return auth.listen(() => void queryClient.invalidateQueries());
  }, [auth, queryClient]);
}
