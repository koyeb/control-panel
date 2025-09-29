import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';

import { ApiValidationError, hasMessage } from 'src/api/api-errors';
import { mapOrganization } from 'src/api/mappers/session';
import { createEnsureApiQueryData } from 'src/api/use-api';
import { container } from 'src/application/container';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/sentry';
import { Link } from 'src/components/link';
import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { TOKENS } from 'src/tokens';
import { assert } from 'src/utils/assert';

const jwtSchema = z.object({
  action: z.string().optional(),
  metadata: z.string().optional(),
  organization_id: z.string().optional(),
});

export const Route = createFileRoute('/account/oauth/github/callback')({
  component: Component,
  pendingComponent: LogoLoading,
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

  async loader({ deps, context: { queryClient } }) {
    const seon = container.resolve(TOKENS.seon);
    const api = container.resolve(TOKENS.api);

    const search = deps.search;
    const redirectUrl = new URL(deps.metadata, window.location.origin);

    if (search.error_description) {
      throw new Error(search.error_description);
    }

    try {
      const { token } = await api.githubOAuthCallback({
        header: { 'seon-fp': await seon.getFingerprint() },
        body: {
          code: search.code,
          state: search.state,
          setup_action: search.setup_action,
          installation_id: search.installation_id,
        },
      });

      if (search.setup_action === undefined) {
        assert(token?.id !== undefined);
        await handleAuthentication(token.id, redirectUrl);
      }

      await handleGithubAppInstalled(queryClient, redirectUrl, deps);
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }

      if (search.setup_action === undefined) {
        await handleAuthenticationError(error, deps);
      } else {
        await handleGithubAppInstallationError(error, redirectUrl);
      }

      throw error;
    }
  },

  onError: reportError,
});

async function handleAuthentication(token: string, redirectUrl: URL) {
  const auth = container.resolve(TOKENS.authentication);

  auth.setToken(token);

  throw redirect({
    to: redirectUrl.pathname,
    search: Object.fromEntries(redirectUrl.searchParams),
    replace: true,
  });
}

async function handleAuthenticationError(error: unknown, deps: typeof Route.types.loaderDeps) {
  const redirectUrl = new URL('/auth/signin', window.location.origin);

  if (deps.action === 'register') {
    redirectUrl.pathname = '/user/settings';
  }

  if (deps.action === 'signin' && isAccountNotFoundError(error)) {
    notify.error(<AccountNotFound />);
  } else if (deps.action === 'signup' && isAccountAlreadyExistsError(error)) {
    notify.error(<AccountAlreadyExists />);
    redirectUrl.pathname = '/auth/signup';
  } else if (isUnauthorizedAccountError(error)) {
    notify.error(error.message);
  }

  throw redirect({
    ...urlToLinkOptions(redirectUrl),
    replace: true,
  });
}

async function handleGithubAppInstalled(
  queryClient: QueryClient,
  redirectUrl: URL,
  { search, organizationId }: typeof Route.types.loaderDeps,
) {
  if (search.setup_action === 'install' && search.state) {
    await queryClient.invalidateQueries({ queryKey: ['getGithubApp'] });

    throw redirect({
      to: redirectUrl.pathname,
      search: Object.fromEntries(redirectUrl.searchParams),
      replace: true,
    });
  }

  const ensureApiQueryData = createEnsureApiQueryData(queryClient);

  const currentOrganization = await ensureApiQueryData('getCurrentOrganization', {}).then(
    ({ organization }) => mapOrganization(organization!),
  );

  if (currentOrganization.id === organizationId) {
    throw redirect({
      to: redirectUrl.pathname,
      search: Object.fromEntries(redirectUrl.searchParams),
      replace: true,
      state: { githubAppInstallationRequested: search.setup_action === 'requested' },
    });
  }
}

async function handleGithubAppInstallationError(error: unknown, redirectUrl: URL) {
  assert(hasMessage(error));
  notify.error(error.message);
  throw redirect({ ...urlToLinkOptions(redirectUrl), replace: true });
}

const isAccountNotFoundError = createValidationGuard(
  ApiValidationError.schema.extend({ fields: z.array(z.object({ description: z.literal('not found') })) }),
);

const isAccountAlreadyExistsError = createValidationGuard(
  ApiValidationError.schema.extend({
    fields: z.array(
      z.object({ description: z.string().refine((str) => str.match(/Email: '.*' already used/) !== null) }),
    ),
  }),
);

const isUnauthorizedAccountError = createValidationGuard(
  z.object({ message: z.literal('This OAuth2 account is not authorized to sign up') }),
);

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

function AccountNotFound() {
  return (
    <div className="col gap-1">
      <div className="font-medium">
        <T id="accountNotFound.title" />
      </div>

      <div className="text-xs">
        <T
          id="accountNotFound.link"
          values={{
            link: (children) => (
              <Link to="/auth/signup" className="underline">
                {children}
              </Link>
            ),
          }}
        />
      </div>
    </div>
  );
}

function AccountAlreadyExists() {
  return (
    <div className="col gap-1">
      <div className="font-medium">
        <T id="accountAlreadyExists.title" />
      </div>

      <div className="text-xs">
        <T
          id="accountAlreadyExists.link"
          values={{
            link: (children) => (
              <Link to="/auth/signin" className="underline">
                {children}
              </Link>
            ),
          }}
        />
      </div>
    </div>
  );
}
