import { useRouteContext } from '@tanstack/react-router';
import { OnRefreshResponse, User, createClient } from '@workos-inc/authkit-js';

import { getConfig } from './config';
import { setAuthKitToken } from './token';

type AuthKitClient = Awaited<ReturnType<typeof createClient>>;

export class AuthKitAdapter {
  private client?: AuthKitClient;
  private state?: Record<string, unknown>;
  public user?: User | null;

  async initialize() {
    if (this.client !== undefined) {
      return;
    }

    const clientId = getConfig('workOsClientId');
    const apiHostname = getConfig('workOsApiHost');

    if (clientId) {
      this.client = await createClient(clientId, {
        devMode: this.devMode,
        apiHostname,
        redirectUri: this.redirectUri,
        onRefresh: this.onRefresh,
        onRedirectCallback: this.onRedirectCallback,
        onBeforeAutoRefresh: () => true,
      });

      this.user = this.client.getUser();
    }
  }

  async signIn({ email, next }: { email?: string; next?: string }) {
    await this.client?.signIn({ loginHint: email, state: { next: next ?? null } });
  }

  async signUp() {
    await this.client?.signUp();
  }

  async signOut() {
    await this.client?.signOut({ navigate: false });
    this.user = null;
  }

  async getAccessToken() {
    return this.client?.getAccessToken();
  }

  get next() {
    const { next } = this.state ?? {};

    if (typeof next === 'string') {
      return next;
    }
  }

  private get devMode() {
    return getConfig('environment') !== 'production';
  }

  private get redirectUri() {
    return `${window.location.origin}/account/workos/callback`;
  }

  private onRefresh = (response: OnRefreshResponse) => {
    setAuthKitToken(response.accessToken);
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
