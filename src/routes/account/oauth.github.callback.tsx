import { createFileRoute, redirect } from '@tanstack/react-router';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';

import { createEnsureApiQueryData, getApi, mapOrganization } from 'src/api';
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

  async loader({ deps, context: { authKit, queryClient } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);
    const api = getApi(authKit.getAccessToken);

    const search = deps.search;
    const redirectUrl = new URL(deps.metadata, window.location.origin);

    try {
      if (search.error_description) {
        throw new Error(search.error_description);
      }

      await api('post /v1/account/oauth', { body: search });

      if (search.setup_action === 'install' && search.state) {
        throw redirect({
          to: redirectUrl.pathname,
          search: Object.fromEntries(redirectUrl.searchParams),
          replace: true,
        });
      }

      const currentOrganization = await ensureApiQueryData('get /v1/account/organization', {}).then(
        ({ organization }) => mapOrganization(organization!),
      );

      if (currentOrganization.id === deps.organizationId) {
        throw redirect({
          to: redirectUrl.pathname,
          search: Object.fromEntries(redirectUrl.searchParams),
          replace: true,
          state: { githubAppInstallationRequested: search.setup_action === 'requested' },
        });
      }
    } catch (error) {
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
