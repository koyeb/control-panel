import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapInvitations } from '../mappers/session';
import { InvitationStatus } from '../model';
import { useApiQueryFn } from '../use-api';

export function useInvitationsQuery({ userId, status }: { userId?: string; status?: InvitationStatus }) {
  return useQuery({
    ...useApiQueryFn('listInvitations', {
      query: {
        user_id: userId,
        statuses: status ? [upperCase(status)] : undefined,
      },
    }),
    select: mapInvitations,
  });
}
