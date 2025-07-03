import { useMutation } from '@tanstack/react-query';

import { api } from 'src/api/api';
import { useAuth } from 'src/application/authentication';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/report-error';
import { LogoLoading } from 'src/components/logo-loading';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { AssertionError, assert } from 'src/utils/assert';

const T = createTranslate('pages.authentication.sso');

export function CannySso() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn() {
      const companyID = searchParams.get('companyID');
      const redirect = searchParams.get('redirect');

      assert(companyID !== null, new AssertionError('Missing companyID query parameter'));
      assert(redirect !== null, new AssertionError('Missing redirect query parameter'));

      const { token: cannyToken } = await api.cannySso({
        token,
      });

      return {
        companyID,
        redirect,
        token: cannyToken!,
      };
    },
    onSuccess({ companyID, redirect, token }) {
      const params = new URLSearchParams({
        companyID,
        redirect,
        ssoToken: token,
      });

      window.location.href = `https://canny.io/api/redirects/sso?${params.toString()}`;
    },
    onError(error) {
      reportError(error);
      notify.error(<SsoError provider="canny" error={error} />);
      navigate({ to: '/', replace: true });
    },
  });

  useMount(() => {
    mutation.mutate();
  });

  return <LogoLoading />;
}

export function DiscourseSsoPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn() {
      const sso = searchParams.get('sso');
      const sig = searchParams.get('sig');

      assert(sso !== null, new AssertionError('Missing sso query parameter'));
      assert(sig !== null, new AssertionError('Missing sig query parameter'));

      const result = await api.discourseSso({
        token,
        body: { payload: sso, sig },
      });

      return {
        sso: result.sso!,
        sig: result.sig!,
      };
    },
    onSuccess({ sso, sig }) {
      // don't use URLSearchParams, as `sso` is already url encoded
      window.location.href = `https://community.koyeb.com/session/sso_login?sso=${sso}&sig=${sig}`;
    },
    onError(error) {
      reportError(error);
      notify.error(<SsoError provider="discourse" error={error} />);
      navigate({ to: '/', replace: true });
    },
  });

  useMount(() => {
    mutation.mutate();
  });

  return <LogoLoading />;
}

function SsoError({ provider, error }: { provider: 'canny' | 'discourse'; error: Error }) {
  return (
    <div className="col gap-1">
      <div className="font-medium">
        <T id={`${provider}Error`} />
      </div>

      <div className="text-dim">{error.message}</div>
    </div>
  );
}
