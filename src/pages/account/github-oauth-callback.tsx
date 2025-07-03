import { useMutation } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';
import { z } from 'zod';

import { api } from 'src/api/api';
import { ApiValidationError } from 'src/api/api-errors';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { getToken, useAuth } from 'src/application/authentication';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/report-error';
import { Link, ValidateLinkOptions } from 'src/components/link';
import { LogoLoading } from 'src/components/logo-loading';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { createTranslate } from 'src/intl/translate';
import { toObject } from 'src/utils/object';

const T = createTranslate('pages.account.githubOAuthCallback');

const schema = z.object({
  action: z.string().optional(),
  metadata: z.string().optional(),
  organization_id: z.string().optional(),
});

export function GithubOauthCallbackPage() {
  const searchParams = useSearchParams();
  const getSeonFingerprint = useSeon();
  const { token, setToken } = useAuth();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const [githubAppInstalled, setGithubAppInstalled] = useState(false);

  const mutation = useMutation({
    async mutationFn() {
      const githubError = searchParams.get('error_description');

      if (githubError) {
        throw new Error(githubError);
      }

      const body = toObject(
        Array.from(searchParams.entries()),
        ([key]) => key,
        ([, value]) => value,
      );

      return api.githubOAuthCallback({
        // send the token for when setup_action=register
        token,
        header: { 'seon-fp': await getSeonFingerprint() },
        body,
      });
    },
    async onSuccess(result) {
      const currentOrganization = await getCurrentOrganization();

      const setupAction = searchParams.get('setup_action');
      const state = searchParams.get('state');

      const statePayload = state ? schema.parse(jwtDecode(state)) : {};
      const { metadata = '/', organization_id = undefined, action } = statePayload;
      const redirect = new URL(metadata, window.location.origin);

      // authentication
      if (setupAction === null && result.token?.id !== undefined) {
        setToken(result.token.id);
        navigate({
          to: redirect.pathname,
          search: Object.fromEntries(redirect.searchParams),
          replace: true,
          state: { createOrganization: action === 'signup' },
        });
        return;
      }

      // github app installation done
      if (setupAction === 'install') {
        if (searchParams.has('state')) {
          await invalidate('getGithubApp');
        } else {
          // approved by github admin
          setGithubAppInstalled(true);
          return;
        }
      }

      if (currentOrganization?.id === organization_id) {
        navigate({
          to: redirect.pathname,
          search: Object.fromEntries(redirect.searchParams),
          replace: true,
          state: { githubAppInstallationRequested: setupAction === 'request' },
        });
      } else {
        setGithubAppInstalled(true);
      }
    },
    onError(error) {
      const state = searchParams.get('state');
      const { action = null } = state ? schema.parse(jwtDecode(state)) : {};

      let redirect: ValidateLinkOptions['to'] = '/auth/signin';

      if (action === 'register') {
        redirect = '/user/settings';
      }

      if (action === 'signin' && isAccountNotFoundError(error)) {
        notify.error(<AccountNotFound />);
      } else if (action === 'signup' && isAccountAlreadyExistsError(error)) {
        notify.error(<AccountAlreadyExists />);
        redirect = '/auth/signup';
      } else if (isUnauthorizedAccountError(error)) {
        notify.error(error.message);
      } else {
        reportError(error);
        notify.error(error.message);
      }

      navigate({ to: redirect, replace: true });
    },
  });

  useMount(() => {
    mutation.mutate();
  });

  if (githubAppInstalled) {
    return (
      <div className="col gap-4 text-center">
        <div className="text-2xl font-medium">
          <T id="githubAppInstalled.title" />
        </div>
        <div>
          <T id="githubAppInstalled.description" />
        </div>
      </div>
    );
  }

  return <LogoLoading />;
}

async function getCurrentOrganization() {
  const token = getToken();

  if (token === undefined) {
    return;
  }

  return api.getCurrentOrganization({ token }).then(
    ({ organization }) => organization,
    () => undefined,
  );
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
