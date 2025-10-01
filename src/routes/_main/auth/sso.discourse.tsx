import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import { getApi } from 'src/api';
import { notify } from 'src/application/notify';
import { LogoLoading } from 'src/components/logo-loading';
import { createTranslate } from 'src/intl/translate';

export const Route = createFileRoute('/_main/auth/sso/discourse')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  validateSearch: z.object({
    sso: z.string(),
    sig: z.string(),
  }),

  loaderDeps({ search }) {
    return {
      sso: search.sso,
      sig: search.sig,
    };
  },

  async loader({ deps }) {
    const api = getApi();

    const result = await api('post /v1/sso/discourse', {
      body: {
        payload: deps.sso,
        sig: deps.sig,
      },
    });

    // don't use URLSearchParams, as `sso` is already url encoded
    window.location.href = `https://community.koyeb.com/session/sso_login?sso=${result.sso}&sig=${result.sig}`;
  },

  onError(error: Error) {
    reportError(error);
    notify.error(<SsoError error={error} />);
    throw redirect({ to: '/', replace: true });
  },
});

const T = createTranslate('pages.authentication.sso');

function SsoError({ error }: { error: Error }) {
  return (
    <div className="col gap-1">
      <div className="font-medium">
        <T id={`discourseError`} />
      </div>

      <div className="text-dim">{error.message}</div>
    </div>
  );
}
