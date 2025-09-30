import { apiQuery } from 'src/api/api';

import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';
import { mapInvitation } from '../mappers/session';
import { InvitationStatus } from '../model';

export function useInvitationsQuery({ userId, status }: { userId?: string; status?: InvitationStatus }) {
  return useQuery({
    ...apiQuery('get /v1/organization_invitations', {
      query: {
        user_id: userId,
        statuses: status ? [upperCase(status)] : undefined,
      },
    }),
    select: ({ invitations }) => invitations!.map(mapInvitation),
  });
}
