import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';

import { getApi } from 'src/api';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/sentry';
import { hasMessage } from 'src/application/validation';
import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const jwtSchema = z.object({
  action: z.string().optional(),
  metadata: z.string().optional(),
  organization_id: z.string().optional(),
});

export const Route = createFileRoute('/account/oauth/github/callback')({
  component: Component,
  pendingComponent: LogoLoading,
  onError: reportError,
  pendingMs: 0,

  validateSearch: z.object({
    error_description: z.string().optional(),
    code: z.string().optional(),
    state: z.string().optional(),
    setup_action: z.string().optional(),
    installation_id: z.string().optional(),
  }),

  loaderDeps({ search }) {
    const payload = search.state ? jwtSchema.parse(jwtDecode(search.state)) : {};

    return {
      search,
      metadata: payload.metadata ?? '/',
      organizationId: payload.organization_id,
      action: payload.action,
    };
  },

  async loader({ deps, context: { authKit } }) {
    const api = getApi(() => authKit.getAccessToken().catch(() => undefined));

    const search = deps.search;
    const redirectUrl = new URL(deps.metadata, window.location.origin);

    try {
      if (search.error_description) {
        throw new Error(search.error_description);
      }

      await api('post /v1/account/oauth', { body: search });

      if (search.setup_action === 'install') {
        if ('code' in search) {
          // 2-step validation
          return;
        }

        throw redirect({
          to: redirectUrl.pathname,
          search: Object.fromEntries(redirectUrl.searchParams),
          replace: true,
        });
      }

      if (search.setup_action === 'request') {
        throw redirect({
          to: redirectUrl.pathname,
          search: Object.fromEntries(redirectUrl.searchParams),
          replace: true,
          state: { githubAppInstallationRequested: true },
        });
      }
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }

      if (hasMessage(error)) {
        notify.error(error.message);
      }

      throw redirect({ ...urlToLinkOptions(redirectUrl), replace: true });
    }
  },
});

const T = createTranslate('pages.account.githubOAuthCallback');

function Component() {
  return (
    <div className="col h-screen items-center justify-center gap-4">
      <div className="text-2xl font-medium">
        <T id="githubAppInstalled.title" />
      </div>
      <div>
        <T id="githubAppInstalled.description" />
      </div>
    </div>
  );
}
