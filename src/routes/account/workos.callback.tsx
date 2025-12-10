import { Spinner } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';

import { ApiError, apiQuery } from 'src/api';
import { LogoLoading } from 'src/components/logo-loading';
import { QueryError } from 'src/components/query-error';
import { createTranslate } from 'src/intl/translate';
import { FullScreenLayout } from 'src/layouts/onboarding/full-screen-layout';

const T = createTranslate('pages.account.workos');

export const Route = createFileRoute('/account/workos/callback')({
  component: Component,

  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
  }),
});

function Component() {
  const navigate = Route.useNavigate();
  const query = useQuery(apiQuery('get /v1/account/profile', {}));

  useEffect(() => {
    if (query.isSuccess) {
      // authKit's redirect callback should navigate
      const id = setTimeout(() => void navigate({ to: '/' }), 2_000);
      return () => clearTimeout(id);
    }
  }, [query.isSuccess, navigate]);

  if (query.isError) {
    if (ApiError.is(query.error) && query.error.status === 404) {
      return <CreatingAccount />;
    }

    return (
      <div className="max-w-2xl p-4">
        <QueryError error={query.error} />
      </div>
    );
  }

  return <LogoLoading />;
}

function CreatingAccount() {
  return (
    <FullScreenLayout>
      <Spinner className="size-8" />

      <div className="mt-6 mb-2 text-xl">
        <T id="creatingAccount.title" />
      </div>

      <div className="text-lg text-dim">
        <T id="creatingAccount.description" />
      </div>
    </FullScreenLayout>
  );
}
