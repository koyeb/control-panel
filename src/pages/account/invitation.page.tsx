import { useQuery } from '@tanstack/react-query';

import { Spinner } from '@koyeb/design-system';
import { isApiError } from 'src/api/api-errors';
import { useUserUnsafe } from 'src/api/hooks/session';
import { mapInvitation } from 'src/api/mappers/session';
import { useApiQueryFn } from 'src/api/use-api';
import { AcceptOrDeclineInvitation } from 'src/components/accept-or-decline-invitation';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.account.invitation');

export function InvitationPage() {
  const user = useUserUnsafe();
  const invitationId = useRouteParam('invitationId');

  const invitationQuery = useQuery({
    ...useApiQueryFn('getInvitation', { path: { id: invitationId } }),
    select: ({ invitation }) => mapInvitation(invitation!),
  });

  if (user === undefined) {
    return null;
  }

  if (invitationQuery.isPending) {
    return (
      <div className="row justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (invitationQuery.isError) {
    const error = invitationQuery.error;

    if (isApiError(error) && error.code === 'not_found') {
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

    return <QueryError error={error} />;
  }

  return <AcceptOrDeclineInvitation invitation={invitationQuery.data} />;
}
