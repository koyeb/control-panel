import { Button, Spinner } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@workos-inc/authkit-react';

import { ApiError, apiQuery, mapInvitation } from 'src/api';
import { HandleInvitation } from 'src/components/handle-invitations';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

const T = createTranslate('pages.account.invitation');

export const Route = createFileRoute('/account/organization_invitations/$invitationId')({
  component: () => (
    <SecondaryLayout>
      <InvitationPage />
    </SecondaryLayout>
  ),
});

export function InvitationPage() {
  const invitationId = useRouteParam('invitationId');

  const invitationQuery = useQuery({
    ...apiQuery('get /v1/organization_invitations/{id}', { path: { id: invitationId } }),
    select: ({ invitation }) => mapInvitation(invitation!),
  });

  if (invitationQuery.isPending) {
    return (
      <div className="row justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (invitationQuery.isError) {
    const error = invitationQuery.error;

    if (ApiError.is(error, 401)) {
      return <UnauthenticatedError />;
    }

    if (ApiError.is(error, 404)) {
      return <NotFoundError />;
    }

    return <QueryError error={error} />;
  }

  return <HandleInvitation invitation={invitationQuery.data} />;
}

function UnauthenticatedError() {
  const { signIn } = useAuth();

  return (
    <div className="col max-w-xl gap-4">
      <h1 className="text-3xl font-semibold">
        <T id="unauthenticated.title" />
      </h1>

      <p className="text-dim">
        <T id="unauthenticated.description" />
      </p>

      <Button className="self-start" onClick={() => signIn()}>
        <T id="unauthenticated.cta" />
      </Button>
    </div>
  );
}

function NotFoundError() {
  return (
    <div className="col gap-4">
      <h1 className="text-3xl font-semibold">
        <T id="notFound.title" />
      </h1>

      <p className="text-dim">
        <T id="notFound.description" />
      </p>
    </div>
  );
}
