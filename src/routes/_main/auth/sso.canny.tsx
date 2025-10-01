import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { getApi } from 'src/api';
import { notify } from 'src/application/notify';
import { LogoLoading } from 'src/components/logo-loading';
import { createTranslate } from 'src/intl/translate';

export const Route = createFileRoute('/_main/auth/sso/canny')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  validateSearch: z.object({
    companyID: z.string(),
    redirect: z.string(),
  }),

  loaderDeps({ search }) {
    return {
      companyID: search.companyID,
      redirect: search.redirect,
    };
  },

  async loader({ deps }) {
    const api = getApi();

    const { token } = await api('post /v1/sso/canny', {});

    const params = new URLSearchParams({
      ...deps,
      ssoToken: token!,
    });

    window.location.href = `https://canny.io/api/redirects/sso?${params.toString()}`;
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
        <T id={`cannyError`} />
      </div>

      <div className="text-dim">{error.message}</div>
    </div>
  );
}
