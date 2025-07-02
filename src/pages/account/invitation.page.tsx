import { Spinner } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';

import { isApiNotFoundError } from 'src/api/api-errors';
import { mapInvitation } from 'src/api/mappers/session';
import { useApiQueryFn } from 'src/api/use-api';
import { HandleInvitation } from 'src/components/handle-invitations';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.account.invitation');

export function InvitationPage() {
  const invitationId = useRouteParam('invitationId');

  const invitationQuery = useQuery({
    ...useApiQueryFn('getInvitation', { path: { id: invitationId } }),
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

    if (isApiNotFoundError(error)) {
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

  return <HandleInvitation invitation={invitationQuery.data} />;
}
