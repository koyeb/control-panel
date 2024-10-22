import { useMutation } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';
import { z } from 'zod';

import { api } from 'src/api/api';
import { ApiValidationError } from 'src/api/api-errors';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/report-error';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { Link } from 'src/components/link';
import { LogoLoading } from 'src/components/logo-loading';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { Translate } from 'src/intl/translate';
import { toObject } from 'src/utils/object';

const T = Translate.prefix('pages.account.githubOAuthCallback');

const schema = z.object({
  action: z.string().optional(),
  metadata: z.string().optional(),
});

export function GithubOauthCallbackPage() {
  const searchParams = useSearchParams();
  const getSeonFingerprint = useSeon();
  const { setToken } = useToken();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const [githubAppInstallRequested, setGithubAppInstallApproved] = useState(false);

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
        header: { 'seon-fp': await getSeonFingerprint() },
        body,
      });
    },
    async onSuccess(result) {
      const action = searchParams.get('setup_action');

      // authentication
      if (result.token?.id !== undefined) {
        setToken(result.token.id);
      }

      // github app installation done
      if (action === 'install') {
        if (searchParams.has('state')) {
          await invalidate('getGithubApp');
        } else {
          // approved by github admin
          setGithubAppInstallApproved(true);
          return;
        }
      }

      const state = searchParams.get('state');
      const { metadata = routes.home() } = state ? schema.parse(jwtDecode(state)) : {};

      navigate(metadata, { state: { githubAppInstallationRequested: action === 'request' } });
    },
    onError(error) {
      const state = searchParams.get('state');
      const { action = null } = state ? schema.parse(jwtDecode(state)) : {};

      let redirect = routes.signIn();

      if (action === 'register') {
        redirect = routes.userSettings.index();
      }

      if (action === 'signin' && isAccountNotFoundError(error)) {
        notify.error(<AccountNotFound />);
      } else if (action === 'signup' && isAccountAlreadyExistsError(error)) {
        notify.error(<AccountAlreadyExists />);
        redirect = routes.signUp();
      } else if (isUnauthorizedAccountError(error)) {
        notify.error(error.message);
      } else {
        reportError(error);
        notify.error(error.message);
      }

      navigate(redirect, { replace: true });
    },
  });

  useMount(() => {
    mutation.mutate();
  });

  if (githubAppInstallRequested) {
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
              <Link href={routes.signUp()} className="underline">
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
              <Link href={routes.signIn()} className="underline">
                {children}
              </Link>
            ),
          }}
        />
      </div>
    </div>
  );
}
