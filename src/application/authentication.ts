import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect } from 'react';

import { useApiMutationFn } from 'src/api/use-api';
import { usePathname } from 'src/hooks/router';
import { TOKENS } from 'src/tokens';
import { inArray } from 'src/utils/arrays';

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
    const removeAccessTokenListener = this.accessToken.listen((value) => {
      this.token = value;
      this.session = false;
      onChange();
    });

    const removeSessionTokenListener = this.sessionToken.listen((value) => {
      this.token = value;
      this.session = true;
      onChange();
    });

    return () => {
      removeAccessTokenListener();
      removeSessionTokenListener();
    };
  }
}

export function useSetToken() {
  const queryClient = useQueryClient();

  return useCallback(
    (token: string | null, session?: boolean) => {
      const auth = container.resolve(TOKENS.authentication);

      auth.setToken(token, session);

      void queryClient.cancelQueries();

      if (auth.token) {
        const queriesToKeep = ['getCurrentUser', 'getCurrentOrganization', 'getSubscription'];

        queryClient.removeQueries({
          predicate: ({ queryKey }) => !inArray(queryKey[0], queriesToKeep),
        });

        void queryClient.invalidateQueries();
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
  const { exp } = jwtDecode(jwt);

  if (exp !== undefined) {
    return new Date(exp * 1000);
  }
}

export function useTokenStorageListener() {
  const queryClient = useQueryClient();
  const auth = container.resolve(TOKENS.authentication);

  useEffect(() => {
    return auth.listen(() => void queryClient.invalidateQueries());
  }, [auth, queryClient]);
}
