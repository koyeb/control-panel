import { useRouteContext } from '@tanstack/react-router';
import { OnRefreshResponse, User, createClient } from '@workos-inc/authkit-js';

import { getConfig } from './config';

type AuthKitClient = Awaited<ReturnType<typeof createClient>>;

export class AuthKitAdapter {
  public client?: AuthKitClient;
  public user?: User | null;
  private state?: Record<string, unknown>;

  async initialize() {
    if (this.client !== undefined) {
      return;
    }

    const clientId = getConfig('workOsClientId');

    if (clientId) {
      this.client = await createClient(clientId, {
        devMode: this.devMode,
        redirectUri: this.redirectUri,
        onRefresh: this.onRefresh,
        onRedirectCallback: this.onRedirectCallback,
      });

      this.user = this.client.getUser();
    }
  }

  signIn(next: string | null) {
    void this.client?.signIn({ state: { next } });
  }

  get next() {
    const { next } = this.state ?? {};

    if (typeof next === 'string') {
      return next;
    }
  }

  private get devMode() {
    return getConfig('environment') === 'development';
  }

  private get redirectUri() {
    return `${window.location.origin}/account/workos/callback`;
  }

  private onRefresh = (response: OnRefreshResponse) => {
    this.user = response.user;
  };

  private onRedirectCallback = ({ state }: { state: Record<string, unknown> | null }) => {
    if (state) {
      this.state = state;
    }
  };
}

export function useAuthKit() {
  return useRouteContext({ from: '__root__', select: ({ authKit }) => authKit });
}
